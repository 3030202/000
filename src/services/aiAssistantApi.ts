// ==============================================================================
// 000-MISSION-CONTROL: OPENAI-COMPATIBLE AI ASSISTANT & MODEL DISCOVERY ENGINE
// ==============================================================================

export interface AiModelItem {
  id: string;
  name?: string;
  owned_by?: string;
  created?: number;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface AiProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  requiresKey: boolean;
  docUrl: string;
}

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: 'ollama',
    name: 'Ollama (Local / VPS)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3',
    requiresKey: false,
    docUrl: 'https://ollama.com'
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    requiresKey: false,
    docUrl: 'https://lmstudio.ai'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter.ai',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    requiresKey: true,
    docUrl: 'https://openrouter.ai'
  },
  {
    id: 'openai',
    name: 'OpenAI Platform',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    requiresKey: true,
    docUrl: 'https://platform.openai.com'
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Fast LPU)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresKey: true,
    docUrl: 'https://groq.com'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    requiresKey: true,
    docUrl: 'https://deepseek.com'
  },
  {
    id: 'custom',
    name: 'Custom Endpoint / vLLM',
    baseUrl: 'http://localhost:8000/v1',
    defaultModel: 'default',
    requiresKey: false,
    docUrl: 'https://vllm.ai'
  }
];

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are 000-Copilot, an elite AI Site Reliability Engineer and DevOps assistant integrated into the 000-Mission-Control operations deck.
You assist the operator with infrastructure diagnostics, RCA (Root Cause Analysis), incident mitigation, shell commands, Docker telemetry, and cybersecurity operations.
Respond concisely in high-density technical style with clear markdown code blocks when providing commands.`;

export const getSavedAiConfig = (): AiConfig => {
  try {
    const raw = localStorage.getItem('000_ai_config');
    if (raw) {
      return {
        ...JSON.parse(raw),
        systemPrompt: JSON.parse(raw).systemPrompt || DEFAULT_SYSTEM_PROMPT
      };
    }
  } catch {}
  return {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    selectedModel: 'llama3.3',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: DEFAULT_SYSTEM_PROMPT
  };
};

export const saveAiConfig = (cfg: AiConfig): void => {
  localStorage.setItem('000_ai_config', JSON.stringify(cfg));
};

/**
 * Normalizes OpenAI-compatible Base URL (trims trailing slashes).
 */
export const normalizeBaseUrl = (url: string): string => {
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'http://' + clean;
  }
  return clean;
};

/**
 * Automatically fetch available models from an OpenAI-compatible /v1/models endpoint.
 */
export const fetchAvailableModels = async (
  rawBaseUrl: string,
  apiKey?: string
): Promise<{ success: boolean; models: AiModelItem[]; error?: string }> => {
  const baseUrl = normalizeBaseUrl(rawBaseUrl);
  const modelsEndpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        models: [],
        error: `HTTP ${response.status} (${response.statusText}) from ${modelsEndpoint}`
      };
    }

    const data = await response.json();
    let rawList: any[] = [];

    if (Array.isArray(data)) {
      rawList = data;
    } else if (Array.isArray(data.data)) {
      rawList = data.data;
    } else if (Array.isArray(data.models)) {
      rawList = data.models;
    }

    const models: AiModelItem[] = rawList.map((item: any) => ({
      id: typeof item === 'string' ? item : item.id || item.name || 'unknown',
      name: item.name || item.id,
      owned_by: item.owned_by || item.publisher || 'custom',
      created: item.created
    }));

    if (models.length === 0) {
      // Fallback if returned object was empty
      models.push({ id: 'default', name: 'default model', owned_by: 'custom' });
    }

    // Sort models alphabetically
    models.sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, models };
  } catch (err: any) {
    return {
      success: false,
      models: [],
      error: err.name === 'AbortError' ? 'Connection timed out (8s)' : err.message || 'Failed to connect to model endpoint'
    };
  }
};

export interface StreamChatOptions {
  config: AiConfig;
  messages: ChatMessage[];
  systemContext?: Record<string, any>;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Executes a streaming chat completion against any OpenAI-compatible provider.
 */
export const streamChatCompletion = async ({
  config,
  messages,
  systemContext,
  signal,
  onChunk,
  onDone,
  onError
}: StreamChatOptions): Promise<void> => {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const completionsEndpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (config.apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  // Format system prompt with live infrastructure context if present
  let dynamicSystemPrompt = config.systemPrompt;
  if (systemContext) {
    dynamicSystemPrompt += `\n\n=== LIVE MISSION CONTROL INFRASTRUCTURE STATE ===\n${JSON.stringify(systemContext, null, 2)}`;
  }

  const payload = {
    model: config.selectedModel || 'default',
    messages: [
      { role: 'system', content: dynamicSystemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true
  };

  try {
    const response = await fetch(completionsEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      let errBody = '';
      try {
        errBody = await response.text();
      } catch {}
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errBody.slice(0, 200)}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by provider response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') {
          onDone(accumulatedText);
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulatedText += delta;
              onChunk(delta);
            }
          } catch {
            // Ignore malformed partial chunks
          }
        }
      }
    }

    onDone(accumulatedText);
  } catch (err: any) {
    if (signal?.aborted) {
      onDone(err.message || 'Stream aborted by user');
      return;
    }
    onError(err.message || 'Failed to stream chat completion');
  }
};
