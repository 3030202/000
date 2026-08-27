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
    id: 'custom',
    name: 'Custom Endpoint / vLLM',
    baseUrl: 'http://localhost:8000/v1',
    defaultModel: 'default',
    requiresKey: false,
    docUrl: 'https://vllm.ai'
  }
];

export const PROVIDER_DEFAULT_MODELS: Record<string, string[]> = {
  openrouter: [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'deepseek/deepseek-r1',
    'deepseek/deepseek-chat',
    'meta-llama/llama-3.3-70b-instruct',
    'google/gemini-2.0-flash-exp:free',
    'qwen/qwen-2.5-coder-32b-instruct'
  ],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini', 'gpt-4-turbo'],
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'deepseek-r1-distill-llama-70b',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  ollama: ['llama3.3', 'deepseek-r1', 'qwen2.5-coder', 'mistral', 'codellama', 'phi3'],
  lmstudio: ['local-model', 'qwen2.5-7b', 'llama-3.2-3b', 'mistral-7b'],
  custom: ['default', 'gpt-4o', 'llama3.3', 'deepseek-r1', 'claude-3.5-sonnet']
};

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
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    selectedModel: 'anthropic/claude-3.5-sonnet',
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
  let clean = (url || '').trim().replace(/\/+$/, '');
  if (!clean) return '';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
};

/**
 * Automatically fetch available models from an OpenAI-compatible /v1/models or /api/tags endpoint.
 * Supports multi-candidate URL resolution, fallback presets, and CORS diagnostics.
 */
export const fetchAvailableModels = async (
  rawBaseUrl: string,
  apiKey?: string
): Promise<{ success: boolean; models: AiModelItem[]; error?: string; endpointUsed?: string }> => {
  let baseUrl = normalizeBaseUrl(rawBaseUrl);
  if (!baseUrl) {
    return { success: false, models: [], error: 'Base URL is empty' };
  }

  // Clean up any extraneous chat/completions or models suffixes
  baseUrl = baseUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/models\/?$/, '');

  // Generate candidate endpoints to test in sequence
  const endpointsToTry: string[] = [];
  if (baseUrl.endsWith('/v1')) {
    endpointsToTry.push(`${baseUrl}/models`);
    const parent = baseUrl.slice(0, -3);
    endpointsToTry.push(`${parent}/api/tags`); // Native Ollama
    endpointsToTry.push(`${parent}/models`);
    endpointsToTry.push(`${baseUrl}/v1/models`);
  } else {
    endpointsToTry.push(`${baseUrl}/v1/models`);
    endpointsToTry.push(`${baseUrl}/models`);
    endpointsToTry.push(`${baseUrl}/api/tags`); // Native Ollama
    endpointsToTry.push(`${baseUrl}/api/v1/models`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  let lastError = '';

  for (const endpoint of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = `HTTP ${response.status} (${response.statusText}) from ${endpoint}`;
        continue;
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        lastError = `Received non-JSON response from ${endpoint}`;
        continue;
      }

      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (Array.isArray(data.data)) {
        rawList = data.data;
      } else if (Array.isArray(data.models)) {
        rawList = data.models;
      }

      const models: AiModelItem[] = rawList.map((item: any) => {
        const id = typeof item === 'string' ? item : item.id || item.name || item.model || 'unknown';
        return {
          id,
          name: item.name || item.id || id,
          owned_by: item.owned_by || item.publisher || (endpoint.includes('tags') ? 'ollama' : 'custom'),
          created: item.created || (item.modified_at ? new Date(item.modified_at).getTime() / 1000 : undefined)
        };
      }).filter(m => m.id && m.id !== 'unknown');

      if (models.length > 0) {
        models.sort((a, b) => a.id.localeCompare(b.id));
        return { success: true, models, endpointUsed: endpoint };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        lastError = `Timeout (6s) connecting to ${endpoint}`;
      } else if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        if (isHttps && endpoint.startsWith('http://')) {
          lastError = `Browser blocked HTTP endpoint "${endpoint}" on HTTPS page (Mixed Content). Use an HTTPS URL or local tunnel.`;
        } else {
          lastError = `CORS or Network Error connecting to "${endpoint}". Verify server is online and allows origin (e.g. OLLAMA_ORIGINS="*").`;
        }
      } else {
        lastError = err.message || `Error connecting to ${endpoint}`;
      }
    }
  }

  // Fallback: Populate preset default models so the user is never stuck with an empty list
  let matchedPreset = 'custom';
  for (const preset of AI_PROVIDER_PRESETS) {
    try {
      const pUrl = new URL(preset.baseUrl);
      if (baseUrl.includes(preset.id) || baseUrl.includes(pUrl.hostname)) {
        matchedPreset = preset.id;
        break;
      }
    } catch {}
  }

  const fallbackList: AiModelItem[] = (PROVIDER_DEFAULT_MODELS[matchedPreset] || PROVIDER_DEFAULT_MODELS.custom).map(id => ({
    id,
    name: id,
    owned_by: matchedPreset
  }));

  return {
    success: false,
    models: fallbackList,
    error: lastError || 'Failed to discover models from candidate endpoints'
  };
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
  let baseUrl = normalizeBaseUrl(config.baseUrl);
  if (!baseUrl) {
    onError('Base URL is empty. Please configure connection settings.');
    return;
  }

  baseUrl = baseUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/models\/?$/, '');
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
