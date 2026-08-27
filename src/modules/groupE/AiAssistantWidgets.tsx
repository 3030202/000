import React, { useState, useEffect, useRef } from 'react';
import { useTools } from '../../context/ToolsContext';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { soundFx } from '../../services/soundFx';
import {
  AiModelItem,
  ChatMessage,
  AI_PROVIDER_PRESETS,
  AiConfig,
  getSavedAiConfig,
  saveAiConfig,
  fetchAvailableModels,
  streamChatCompletion
} from '../../services/aiAssistantApi';

export const AiCopilotWidget: React.FC = () => {
  const { addLog } = useTools();
  const { healthEndpoints, defcon } = useDashboard();
  const [config, setConfig] = useState<AiConfig>(getSavedAiConfig);
  const [inputPrompt, setInputPrompt] = useState('');
  const [lastAnswer, setLastAnswer] = useState<string>('000-Copilot online. Ready for infrastructure diagnostics and DevOps assistance.');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleQuickSend = async (promptText: string) => {
    if (!promptText.trim() || isStreaming) return;
    soundFx.playClick(900);
    setInputPrompt('');
    setIsStreaming(true);
    setLastAnswer('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString()
    };

    const sysContext = {
      defconLevel: defcon,
      healthEndpointsSummary: healthEndpoints.map(e => ({ name: e.name, url: e.url, status: e.status, latency: e.latencyMs })),
      timestamp: new Date().toISOString()
    };

    let responseBuffer = '';
    await streamChatCompletion({
      config,
      messages: [userMsg],
      systemContext: sysContext,
      onChunk: (delta) => {
        responseBuffer += delta;
        setLastAnswer(responseBuffer);
      },
      onDone: (fullText) => {
        soundFx.playDeploySuccess();
        setIsStreaming(false);
        setLastAnswer(fullText || 'Response completed.');
        addLog('AI-COPILOT', `Query processed: "${promptText.slice(0, 30)}..."`, 'info');
      },
      onError: (err) => {
        soundFx.playAlarm();
        setIsStreaming(false);
        setLastAnswer(`[Error: ${err}] Check Base URL/API Key in expanded workbench.`);
        addLog('AI-COPILOT', `Error: ${err}`, 'warn');
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pill green">● AI COPILOT READY</span>
        <span style={{ fontSize: '8.5px', color: 'var(--cyan)', fontFamily: 'monospace' }}>
          {config.selectedModel}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          background: '#020306',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '6px',
          overflowY: 'auto',
          fontSize: '9.5px',
          fontFamily: 'monospace',
          color: 'var(--fg)',
          lineHeight: '1.4',
          maxHeight: '75px'
        }}
      >
        {lastAnswer}
        {isStreaming && <span className="animate-pulse" style={{ color: 'var(--cyan)' }}> ▋</span>}
      </div>

      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleQuickSend('Analyze current health endpoints and SLA')}
          disabled={isStreaming}
          style={{ fontSize: '8px', padding: '1px 4px' }}
        >
          🔍 Health RCA
        </button>
        <button
          onClick={() => handleQuickSend('Recommend security checklist for zero-knowledge vault')}
          disabled={isStreaming}
          style={{ fontSize: '8px', padding: '1px 4px' }}
        >
          🛡️ Security
        </button>
        <button
          onClick={() => handleQuickSend('Show quick docker compose troubleshooting commands')}
          disabled={isStreaming}
          style={{ fontSize: '8px', padding: '1px 4px' }}
        >
          🐳 Docker
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleQuickSend(inputPrompt); }}
          placeholder="Ask 000-Copilot (OpenAI / Ollama / Groq)..."
          disabled={isStreaming}
          style={{ flex: 1, fontSize: '9.5px', padding: '3px 6px' }}
        />
        <button
          className="btn-accent"
          onClick={() => handleQuickSend(inputPrompt)}
          disabled={isStreaming || !inputPrompt.trim()}
          style={{ fontSize: '9px', padding: '0 8px' }}
        >
          {isStreaming ? '...' : 'Ask'}
        </button>
      </div>
    </div>
  );
};

export const AiCopilotExpandedWorkbench: React.FC = () => {
  const { addLog, termHistory } = useTools();
  const { healthEndpoints, defcon, projects } = useDashboard();
  const { isVaultUnlocked } = useVault();

  const [config, setConfig] = useState<AiConfig>(getSavedAiConfig);
  const [availableModels, setAvailableModels] = useState<AiModelItem[]>([]);
  const [modelFilter, setModelFilter] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Hello! I am **000-Copilot**, your OpenAI-compatible SRE & DevOps AI assistant. I have direct context of your active clusters, health SLA, and containers. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'config'>('chat');

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial load of models if base URL exists
  useEffect(() => {
    handleFetchModels(config.baseUrl, config.apiKey);
  }, []);

  const handleSaveAndSyncConfig = (newCfg: AiConfig) => {
    setConfig(newCfg);
    saveAiConfig(newCfg);
  };

  const handlePresetSelect = (presetId: string) => {
    soundFx.playClick(900);
    const preset = AI_PROVIDER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const newCfg: AiConfig = {
      ...config,
      baseUrl: preset.baseUrl,
      selectedModel: preset.defaultModel
    };
    handleSaveAndSyncConfig(newCfg);
    handleFetchModels(preset.baseUrl, newCfg.apiKey);
    addLog('AI-CONFIG', `Selected preset: ${preset.name}`, 'info');
  };

  const handleFetchModels = async (baseUrl: string, apiKey?: string) => {
    setIsFetchingModels(true);
    setFetchError('');
    soundFx.playClick(800);

    const res = await fetchAvailableModels(baseUrl, apiKey);
    setIsFetchingModels(false);

    if (res.success && res.models.length > 0) {
      soundFx.playDeploySuccess();
      setAvailableModels(res.models);
      // If current selected model not in list, pick first
      if (!res.models.some(m => m.id === config.selectedModel)) {
        const nextModel = res.models[0].id;
        handleSaveAndSyncConfig({ ...config, selectedModel: nextModel });
      }
      addLog('AI-MODELS', `Fetched ${res.models.length} models from ${baseUrl}`, 'success');
    } else {
      soundFx.playAlarm();
      setFetchError(res.error || 'Failed to fetch models');
      addLog('AI-MODELS', `Error fetching models: ${res.error}`, 'warn');
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isStreaming) return;

    soundFx.playClick(1000);
    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      modelUsed: config.selectedModel
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);

    const liveContext = {
      defconLevel: defcon,
      vaultStatus: isVaultUnlocked ? 'UNLOCKED' : 'LOCKED',
      totalProjects: projects.length,
      projectsList: projects.map(p => ({ name: p.name, env: p.env, status: p.status })),
      healthEndpoints: healthEndpoints.map(e => ({ name: e.name, url: e.url, status: e.status, latencyMs: e.latencyMs })),
      recentLogs: termHistory.slice(-5),
      timestamp: new Date().toISOString()
    };

    abortControllerRef.current = new AbortController();

    let streamBuffer = '';
    await streamChatCompletion({
      config,
      messages: [...messages, userMsg],
      systemContext: liveContext,
      signal: abortControllerRef.current.signal,
      onChunk: (delta) => {
        streamBuffer += delta;
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: streamBuffer } : m));
      },
      onDone: (fullText) => {
        soundFx.playDeploySuccess();
        setIsStreaming(false);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullText || streamBuffer } : m));
        addLog('AI-CHAT', `AI response generated (${config.selectedModel})`, 'success');
      },
      onError: (err) => {
        soundFx.playAlarm();
        setIsStreaming(false);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: `⚠️ **Error communicating with AI provider:**\n\`${err}\`\n\nPlease verify Base URL and API Key in Connection Settings.` } : m));
        addLog('AI-CHAT', `Streaming error: ${err}`, 'warn');
      }
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      soundFx.playLock();
      setIsStreaming(false);
      addLog('AI-CHAT', 'Streaming aborted by operator', 'info');
    }
  };

  const handleClearChat = () => {
    soundFx.playClick(600);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your next DevOps query.',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const filteredModels = availableModels.filter(m =>
    m.id.toLowerCase().includes(modelFilter.toLowerCase())
  );

  return (
    <div className="workbench-split">
      {/* Left Column: Streaming Markdown Chat */}
      <div className="workbench-left" style={{ padding: '8px', gap: '6px' }}>
        {/* Chat Header & Mode Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 'bold' }}>
              🤖 000-MISSION AI COPILOT
            </span>
            <span className="pill green" style={{ fontSize: '8.5px' }}>
              {config.selectedModel}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleClearChat}
              disabled={isStreaming}
              style={{ fontSize: '8.5px', padding: '1px 5px' }}
            >
              🧹 Clear
            </button>
            <button
              className={activeTab === 'chat' ? 'btn-accent' : ''}
              onClick={() => setActiveTab('chat')}
              style={{ fontSize: '8.5px', padding: '1px 5px' }}
            >
              💬 Chat
            </button>
            <button
              className={activeTab === 'context' ? 'btn-accent' : ''}
              onClick={() => setActiveTab('context')}
              style={{ fontSize: '8.5px', padding: '1px 5px' }}
            >
              🌐 Context
            </button>
          </div>
        </div>

        {/* Quick DevOps Prompt Chips */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleSendMessage('Perform Root Cause Analysis (RCA) on any degraded endpoints or anomalies')}
            disabled={isStreaming}
            style={{ fontSize: '8.5px', padding: '2px 5px' }}
          >
            🔍 Root Cause Analysis (RCA)
          </button>
          <button
            onClick={() => handleSendMessage('Review system security posture: DEFCON level, Zero-Knowledge secrets vault, and audit rules')}
            disabled={isStreaming}
            style={{ fontSize: '8.5px', padding: '2px 5px' }}
          >
            🛡️ Security Audit
          </button>
          <button
            onClick={() => handleSendMessage('Generate bash runbook script to restart and healthcheck all docker services')}
            disabled={isStreaming}
            style={{ fontSize: '8.5px', padding: '2px 5px' }}
          >
            💻 Bash Runbook
          </button>
          <button
            onClick={() => handleSendMessage('Provide architecture summary of the mission control deck and active telemetry')}
            disabled={isStreaming}
            style={{ fontSize: '8.5px', padding: '2px 5px' }}
          >
            📊 Architecture
          </button>
        </div>

        {/* Chat Message Stream */}
        {activeTab === 'chat' ? (
          <div
            style={{
              flex: 1,
              background: '#020408',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '8px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '8.5px', color: 'var(--fg-muted)', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontWeight: 'bold', color: msg.role === 'user' ? 'var(--cyan)' : 'var(--green)' }}>
                    {msg.role === 'user' ? 'OPERATOR' : `000-COPILOT (${msg.modelUsed || config.selectedModel})`}
                  </span>
                  <span>{msg.timestamp.substring(11, 19)}</span>
                </div>

                <div
                  style={{
                    background: msg.role === 'user' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.75)',
                    border: msg.role === 'user' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '10px',
                    lineHeight: '1.45',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'var(--cyan)' }}>
                <span className="animate-pulse">● Generating streaming inference...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        ) : (
          /* Live Infrastructure Context Preview */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            <div style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>
              LIVE INFRASTRUCTURE STATE INJECTED INTO SYSTEM PROMPT:
            </div>
            <pre
              style={{
                flex: 1,
                background: '#020306',
                border: '1px solid var(--border)',
                padding: '8px',
                color: 'var(--green)',
                fontSize: '9.5px',
                overflow: 'auto',
                lineHeight: '1.3'
              }}
            >
              {JSON.stringify(
                {
                  defconLevel: defcon,
                  vaultStatus: isVaultUnlocked ? 'UNLOCKED' : 'LOCKED',
                  projectsCount: projects.length,
                  healthEndpoints: healthEndpoints.map(e => ({ name: e.name, url: e.url, status: e.status, latencyMs: e.latencyMs }))
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(); }}
            placeholder="Ask AI Copilot for diagnostics, commands, analysis..."
            disabled={isStreaming}
            style={{ flex: 1, fontSize: '10px', padding: '6px 8px' }}
          />
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              style={{ color: 'var(--red)', borderColor: 'var(--red)', fontSize: '10px', padding: '0 10px' }}
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              className="btn-accent"
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim()}
              style={{ fontSize: '10px', padding: '0 12px' }}
            >
              Send ⏎
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Connection Settings & Model Discovery */}
      <div className="workbench-right" style={{ padding: '8px', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
          ⚙️ OPENAI-COMPATIBLE CONNECTION & MODELS
        </div>

        {/* 1-Click Provider Presets */}
        <div>
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginBottom: '3px' }}>1-CLICK PROVIDER PRESETS</div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {AI_PROVIDER_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                style={{ fontSize: '8.5px', padding: '2px 5px' }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Base URL Configuration */}
        <div>
          <label style={{ fontSize: '9px', color: 'var(--fg-muted)', display: 'block', marginBottom: '2px' }}>
            OPENAI-COMPATIBLE BASE URL
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              value={config.baseUrl}
              onChange={e => handleSaveAndSyncConfig({ ...config, baseUrl: e.target.value })}
              placeholder="http://localhost:11434/v1 or https://openrouter.ai/api/v1"
              style={{ flex: 1, fontSize: '9.5px', fontFamily: 'monospace' }}
            />
            <button
              className="btn-accent"
              onClick={() => handleFetchModels(config.baseUrl, config.apiKey)}
              disabled={isFetchingModels}
              style={{ fontSize: '9px', padding: '0 6px', whiteSpace: 'nowrap' }}
            >
              {isFetchingModels ? 'Syncing...' : '🔄 Sync Models'}
            </button>
          </div>
        </div>

        {/* API Key Configuration */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>
              API KEY / BEARER TOKEN (Optional for local Ollama/LM Studio)
            </label>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{ fontSize: '8px', padding: '0 3px' }}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={e => handleSaveAndSyncConfig({ ...config, apiKey: e.target.value })}
            placeholder="sk-or-v1-... or leave blank for local"
            style={{ width: '100%', fontSize: '9.5px', fontFamily: 'monospace' }}
          />
        </div>

        {/* Error Alert if any */}
        {fetchError && (
          <div style={{ padding: '4px 6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '9px', borderRadius: '4px' }}>
            ⚠️ {fetchError}
          </div>
        )}

        {/* Discovered Models Dropdown / Selector */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <label style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>
              DISCOVERED MODELS ({availableModels.length})
            </label>
            <input
              type="text"
              value={modelFilter}
              onChange={e => setModelFilter(e.target.value)}
              placeholder="Filter..."
              style={{ width: '80px', fontSize: '8.5px', padding: '1px 3px' }}
            />
          </div>

          <div
            style={{
              flex: 1,
              background: '#020306',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              overflowY: 'auto',
              maxHeight: '120px'
            }}
          >
            {filteredModels.length > 0 ? (
              filteredModels.map(m => {
                const isSelected = m.id === config.selectedModel;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      soundFx.playClick(900);
                      handleSaveAndSyncConfig({ ...config, selectedModel: m.id });
                    }}
                    style={{
                      padding: '4px 6px',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--cyan)' : 'var(--fg)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{isSelected ? '✓ ' : ''}{m.id}</span>
                    <span style={{ fontSize: '7.5px', color: 'var(--fg-muted)' }}>{m.owned_by}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--fg-dim)', fontSize: '9px' }}>
                {isFetchingModels ? 'Connecting to /v1/models...' : 'No models loaded. Click "🔄 Sync Models" above.'}
              </div>
            )}
          </div>
        </div>

        {/* Inference Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--fg-muted)' }}>
              <span>TEMPERATURE</span>
              <span>{config.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={e => handleSaveAndSyncConfig({ ...config, temperature: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--fg-muted)' }}>
              <span>MAX TOKENS</span>
              <span>{config.maxTokens}</span>
            </div>
            <input
              type="number"
              value={config.maxTokens}
              onChange={e => handleSaveAndSyncConfig({ ...config, maxTokens: parseInt(e.target.value) || 1024 })}
              style={{ width: '100%', fontSize: '9px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
