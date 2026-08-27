import React, { useState, useEffect, useRef } from 'react';
import { useTools } from '../../context/ToolsContext';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { soundFx } from '../../services/soundFx';
import {
  AiModelItem,
  ChatMessage,
  ImageAttachment,
  ToolCallExecution,
  AI_PROVIDER_PRESETS,
  PROVIDER_DEFAULT_MODELS,
  AiConfig,
  getSavedAiConfig,
  saveAiConfig,
  SavedProviderProfile,
  getSavedProviderProfiles,
  saveProviderProfiles,
  getFavoriteProviderIds,
  saveFavoriteProviderIds,
  getFavoriteModelIds,
  saveFavoriteModelIds,
  fetchAvailableModels,
  streamChatCompletion,
  detectModelCapabilities
} from '../../services/aiAssistantApi';
import {
  VoiceConfig,
  VoiceState,
  OPENAI_VOICES,
  getSavedVoiceConfig,
  saveVoiceConfig,
  voiceEngine
} from '../../services/voiceAssistantEngine';
import { CyberAudioVisualizer } from '../../components/common/CyberAudioVisualizer';

export const AiCopilotWidget: React.FC = () => {
  const { addLog } = useTools();
  const { healthEndpoints, defcon } = useDashboard();
  const [config] = useState<AiConfig>(getSavedAiConfig);
  const [voiceConfig] = useState<VoiceConfig>(getSavedVoiceConfig);
  const [inputPrompt, setInputPrompt] = useState('');
  const [lastAnswer, setLastAnswer] = useState<string>('000-Copilot online. Ready for infrastructure diagnostics and voice interaction.');
  const [isStreaming, setIsStreaming] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  const handleQuickSend = async (promptText: string) => {
    if (!promptText.trim() || isStreaming) return;
    soundFx.playClick(900);
    setInputPrompt('');
    setIsStreaming(true);
    setVoiceState('thinking');
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

        // Optional auto-speak
        if (voiceConfig.autoSpeak && fullText) {
          setVoiceState('speaking');
          voiceEngine.speak(
            fullText,
            voiceConfig,
            config.baseUrl,
            config.apiKey,
            () => setVoiceState('speaking'),
            () => setVoiceState('idle')
          );
        } else {
          setVoiceState('idle');
        }
      },
      onError: (err) => {
        soundFx.playAlarm();
        setIsStreaming(false);
        setVoiceState('idle');
        setLastAnswer(`[Error: ${err}] Check Base URL/API Key in expanded workbench.`);
        addLog('AI-COPILOT', `Error: ${err}`, 'warn');
      }
    });
  };

  const handleToggleMic = () => {
    if (voiceState === 'listening') {
      voiceEngine.stopListening();
      setVoiceState('idle');
    } else {
      soundFx.playClick(1000);
      setVoiceState('listening');
      voiceEngine.startListening({
        language: voiceConfig.sttLanguage,
        onResult: (finalText) => {
          setVoiceState('idle');
          if (finalText) {
            setInputPrompt(finalText);
            handleQuickSend(finalText);
          }
        },
        onInterim: (interim) => {
          setInputPrompt(interim);
        },
        onError: (err) => {
          soundFx.playAlarm();
          setVoiceState('idle');
          addLog('VOICE-MIC', `STT Error: ${err}`, 'warn');
        },
        onEnd: () => {
          setVoiceState('idle');
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="pill green">● AI COPILOT</span>
          <span style={{ fontSize: '8px', color: voiceState === 'listening' ? 'var(--green)' : 'var(--fg-dim)' }}>
            {voiceState === 'listening' ? '🎙️ REC' : voiceState === 'speaking' ? '🔊 VOICE' : ''}
          </span>
        </div>
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
          maxHeight: '70px'
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
        <button
          onClick={handleToggleMic}
          className={voiceState === 'listening' ? 'btn-accent' : ''}
          style={{
            padding: '0 6px',
            fontSize: '11px',
            borderColor: voiceState === 'listening' ? 'var(--green)' : undefined,
            color: voiceState === 'listening' ? 'var(--green)' : undefined
          }}
          title="Voice Speech-to-Text"
        >
          🎙️
        </button>
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleQuickSend(inputPrompt); }}
          placeholder="Ask or Speak to 000-Copilot..."
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
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(getSavedVoiceConfig);
  const [availableModels, setAvailableModels] = useState<AiModelItem[]>([]);
  const [modelFilter, setModelFilter] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<'all' | 'favorites' | 'vision' | 'tools' | 'reasoning' | 'code' | 'tts'>('all');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Provider Profiles & Favorite Models & Favorite Providers
  const [savedProfiles, setSavedProfiles] = useState<SavedProviderProfile[]>(getSavedProviderProfiles);
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>(getFavoriteModelIds);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>(getFavoriteProviderIds);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Hello! I am **000-Copilot**, your OpenAI-compatible SRE & DevOps AI assistant with real-time voice interaction and hands-free duplex. Speak into your microphone or type a command below.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'voice' | 'config'>('chat');

  const [browserVoicesList, setBrowserVoicesList] = useState<SpeechSynthesisVoice[]>([]);
  const [showOllamaGuide, setShowOllamaGuide] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial load of models & voices
  useEffect(() => {
    // Immediately load models list
    const matchedPreset = AI_PROVIDER_PRESETS.find(p => config.baseUrl.includes(p.id))?.id || 'ollama';
    const initialList: AiModelItem[] = (PROVIDER_DEFAULT_MODELS[matchedPreset] || PROVIDER_DEFAULT_MODELS.ollama).map(id => ({
      id,
      name: id,
      owned_by: matchedPreset,
      capabilities: detectModelCapabilities(id, matchedPreset)
    }));
    setAvailableModels(initialList);

    handleFetchModels(config.baseUrl, config.apiKey);

    const loadVoices = () => {
      const v = voiceEngine.getBrowserVoices();
      setBrowserVoicesList(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSaveAndSyncConfig = (newCfg: AiConfig) => {
    setConfig(newCfg);
    saveAiConfig(newCfg);
  };

  const handleSaveAndSyncVoiceConfig = (newVoiceCfg: VoiceConfig) => {
    setVoiceConfig(newVoiceCfg);
    saveVoiceConfig(newVoiceCfg);
  };

  const handleQuickConnectOllama = (url = 'http://localhost:11434/v1') => {
    soundFx.playDeploySuccess();
    const newCfg: AiConfig = {
      ...config,
      baseUrl: url,
      apiKey: '',
      selectedModel: 'qwen-coder-32b-abliterated',
      activeProviderId: url.includes('127.0.0.1') ? 'ollama-ip' : 'ollama'
    };
    handleSaveAndSyncConfig(newCfg);
    handleFetchModels(url);
    addLog('OLLAMA', `Connected to local Ollama instance at ${url} with model qwen-coder-32b-abliterated`, 'success');
  };

  const handleToggleFavorite = (modelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.playClick(1000);
    setFavoriteModelIds(prev => {
      const next = prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId];
      saveFavoriteModelIds(next);
      addLog('AI-FAV', `${next.includes(modelId) ? 'Starred' : 'Unstarred'} favorite model: ${modelId}`, 'info');
      return next;
    });
  };

  const handleToggleFavoriteProvider = (providerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.playClick(1000);
    setFavoriteProviderIds(prev => {
      const next = prev.includes(providerId) ? prev.filter(id => id !== providerId) : [...prev, providerId];
      saveFavoriteProviderIds(next);
      addLog('AI-FAV', `${next.includes(providerId) ? 'Starred' : 'Unstarred'} favorite provider: ${providerId}`, 'info');
      return next;
    });
  };

  const handleSelectProviderProfile = (profileId: string) => {
    soundFx.playClick(900);
    const profile = savedProfiles.find(p => p.id === profileId);
    if (!profile) return;

    const newCfg: AiConfig = {
      ...config,
      baseUrl: profile.baseUrl,
      apiKey: profile.apiKey,
      selectedModel: profile.selectedModel || config.selectedModel,
      activeProviderId: profile.id
    };
    handleSaveAndSyncConfig(newCfg);

    // Pre-populate models list with preset models
    const matchedPreset = AI_PROVIDER_PRESETS.find(p => p.id === profile.id || profile.baseUrl.includes(p.id))?.id || 'custom';
    const fallbackList: AiModelItem[] = (PROVIDER_DEFAULT_MODELS[matchedPreset] || PROVIDER_DEFAULT_MODELS.custom).map(id => ({
      id,
      name: id,
      owned_by: matchedPreset,
      capabilities: detectModelCapabilities(id, matchedPreset)
    }));
    setAvailableModels(fallbackList);

    handleFetchModels(profile.baseUrl, profile.apiKey);
    addLog('AI-PROFILE', `Switched to provider profile: ${profile.name}`, 'info');
  };

  const handleSaveCurrentAsProfile = () => {
    if (!newProfileName.trim()) return;
    soundFx.playDeploySuccess();
    const newProfile: SavedProviderProfile = {
      id: `custom_${Date.now()}`,
      name: newProfileName.trim(),
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      selectedModel: config.selectedModel,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedProfiles, newProfile];
    setSavedProfiles(updated);
    saveProviderProfiles(updated);
    handleSaveAndSyncConfig({ ...config, activeProviderId: newProfile.id });
    setNewProfileName('');
    setIsSavingProfile(false);
    addLog('AI-PROFILE', `Saved new provider profile: "${newProfile.name}"`, 'success');
  };

  const handleDeleteProfile = (profileId: string) => {
    soundFx.playAlarm();
    const updated = savedProfiles.filter(p => p.id !== profileId);
    setSavedProfiles(updated);
    saveProviderProfiles(updated);
    if (config.activeProviderId === profileId) {
      handleSelectProviderProfile(updated[0]?.id || 'tooken');
    }
    addLog('AI-PROFILE', 'Deleted custom provider profile', 'warn');
  };

  const handlePresetSelect = (presetId: string) => {
    handleSelectProviderProfile(presetId);
  };

  const handleFetchModels = async (baseUrl: string, apiKey?: string) => {
    setIsFetchingModels(true);
    setFetchError('');
    soundFx.playClick(800);

    const res = await fetchAvailableModels(baseUrl, apiKey);
    setIsFetchingModels(false);

    if (res.models && res.models.length > 0) {
      setAvailableModels(res.models);
      if (res.success) {
        soundFx.playDeploySuccess();
        addLog('AI-MODELS', `Discovered ${res.models.length} models via ${res.endpointUsed || baseUrl}`, 'success');
      } else {
        setFetchError(res.error || 'Server did not return live models. Showing default provider models.');
        addLog('AI-MODELS', `Model sync notice: ${res.error}`, 'warn');
      }
    } else {
      soundFx.playAlarm();
      setFetchError(res.error || 'Failed to fetch models from endpoint.');
      addLog('AI-MODELS', `Error fetching models: ${res.error}`, 'warn');
    }
  };

  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCaps = detectModelCapabilities(config.selectedModel);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        soundFx.playClick(1000);
        setAttachedImages(prev => [
          ...prev,
          {
            name: file.name,
            dataUrl: reader.result as string,
            type: file.type,
            size: file.size
          }
        ]);
        addLog('AI-VISION', `Attached image: ${file.name} (${Math.round(file.size / 1024)} KB)`, 'info');
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData?.files?.length) {
      for (const file of Array.from(e.clipboardData.files)) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            soundFx.playClick(1000);
            setAttachedImages(prev => [
              ...prev,
              {
                name: file.name || `screenshot_${Date.now()}.png`,
                dataUrl: reader.result as string,
                type: file.type,
                size: file.size
              }
            ]);
            addLog('AI-VISION', `Pasted clipboard screenshot (${Math.round(file.size / 1024)} KB)`, 'info');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Full-Duplex Loop: trigger voice listening after speech ends
  const triggerAutoListenIfHandsFree = () => {
    if (voiceConfig.isHandsFree) {
      setTimeout(() => {
        handleStartMic();
      }, 400);
    } else {
      setVoiceState('idle');
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if ((!textToSend.trim() && attachedImages.length === 0) || isStreaming) return;

    soundFx.playClick(1000);
    setInputPrompt('');

    const currentAttachments = [...attachedImages];
    setAttachedImages([]);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      images: currentAttachments.length > 0 ? currentAttachments : undefined
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
    setVoiceState('thinking');

    const liveContext = {
      defconLevel: defcon,
      vaultStatus: isVaultUnlocked ? 'UNLOCKED' : 'LOCKED',
      totalProjects: projects.length,
      projectsList: projects.map(p => ({ name: p.name, env: p.env, status: p.status })),
      healthEndpoints: healthEndpoints.map(e => ({ name: e.name, url: e.url, status: e.status, latencyMs: e.latencyMs })),
      recentLogs: termHistory.slice(-5),
      timestamp: new Date().toISOString()
    };

    const toolExecutionCtx = {
      dashboard: { defcon, projects, healthEndpoints },
      tools: { addLog, termHistory },
      vault: { isVaultUnlocked }
    };

    abortControllerRef.current = new AbortController();

    let streamBuffer = '';
    await streamChatCompletion({
      config,
      messages: [...messages, userMsg],
      systemContext: liveContext,
      toolContext: toolExecutionCtx,
      signal: abortControllerRef.current.signal,
      onToolCall: (tc) => {
        soundFx.playClick(900);
        addLog('AI-TOOL', `Autonomous tool execution: ${tc.toolName} (${tc.status})`, tc.status === 'error' ? 'warn' : 'info');
      },
      onChunk: (delta) => {
        streamBuffer += delta;
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: streamBuffer } : m));
      },
      onDone: (fullText) => {
        soundFx.playDeploySuccess();
        setIsStreaming(false);
        const finalAnswer = fullText || streamBuffer;
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: finalAnswer } : m));
        addLog('AI-CHAT', `AI response generated (${config.selectedModel})`, 'success');

        // Synthesize voice reply if autoSpeak or HandsFree is on
        if ((voiceConfig.autoSpeak || voiceConfig.isHandsFree) && finalAnswer) {
          setVoiceState('speaking');
          voiceEngine.speak(
            finalAnswer,
            voiceConfig,
            config.baseUrl,
            config.apiKey,
            () => setVoiceState('speaking'),
            () => triggerAutoListenIfHandsFree()
          );
        } else {
          setVoiceState('idle');
        }
      },
      onError: (err) => {
        soundFx.playAlarm();
        setIsStreaming(false);
        setVoiceState('idle');
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: `⚠️ **Error communicating with AI provider:**\n\`${err}\`\n\nPlease verify Base URL and API Key in Connection Settings.` } : m));
        addLog('AI-CHAT', `Streaming error: ${err}`, 'warn');
      }
    });
  };

  const handleStartMic = () => {
    soundFx.playClick(1000);
    setVoiceState('listening');
    voiceEngine.startListening({
      language: voiceConfig.sttLanguage,
      onResult: (finalText) => {
        setVoiceState('idle');
        if (finalText) {
          setInputPrompt(finalText);
          handleSendMessage(finalText);
        }
      },
      onInterim: (interim) => {
        setInputPrompt(interim);
      },
      onError: (err) => {
        soundFx.playAlarm();
        setVoiceState('idle');
        addLog('VOICE-MIC', `STT Error: ${err}`, 'warn');
      },
      onEnd: () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      }
    });
  };

  const handleStopMic = () => {
    soundFx.playClick(800);
    voiceEngine.stopListening();
    setVoiceState('idle');
  };

  const handleSpeakSingleMessage = (text: string) => {
    soundFx.playClick(900);
    setVoiceState('speaking');
    voiceEngine.speak(
      text,
      voiceConfig,
      config.baseUrl,
      config.apiKey,
      () => setVoiceState('speaking'),
      () => setVoiceState('idle')
    );
  };

  const handleStopAudio = () => {
    soundFx.playLock();
    voiceEngine.stopSpeaking();
    voiceEngine.stopListening();
    setVoiceState('idle');
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      soundFx.playLock();
      setIsStreaming(false);
      setVoiceState('idle');
      addLog('AI-CHAT', 'Streaming aborted by operator', 'info');
    }
  };

  const handleClearChat = () => {
    soundFx.playClick(600);
    handleStopAudio();
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your next voice or text query.',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const filteredModels = availableModels.filter(m => {
    // 1. Text filter (ID, name, owned_by)
    const matchesText =
      !modelFilter ||
      m.id.toLowerCase().includes(modelFilter.toLowerCase()) ||
      (m.name && m.name.toLowerCase().includes(modelFilter.toLowerCase())) ||
      (m.owned_by && m.owned_by.toLowerCase().includes(modelFilter.toLowerCase()));
    if (!matchesText) return false;

    // 2. Category filter
    if (selectedFilterCategory === 'favorites') {
      return favoriteModelIds.includes(m.id);
    }
    if (selectedFilterCategory === 'vision') {
      return m.capabilities.vision;
    }
    if (selectedFilterCategory === 'tools') {
      return m.capabilities.tools;
    }
    if (selectedFilterCategory === 'reasoning') {
      return m.capabilities.reasoning;
    }
    if (selectedFilterCategory === 'code') {
      return m.capabilities.code;
    }
    if (selectedFilterCategory === 'tts') {
      return m.capabilities.tts;
    }
    return true;
  });

  const activeProfile = savedProfiles.find(p => p.id === config.activeProviderId || p.baseUrl === config.baseUrl);

  return (
    <div className="workbench-split">
      {/* Left Column: Streaming Markdown Chat & Voice Visualizer */}
      <div className="workbench-left" style={{ padding: '8px', gap: '6px' }}>
        {/* Chat Header & Capabilities Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 'bold' }}>
              🤖 000-COPILOT
            </span>
            <span className="pill green" style={{ fontSize: '8px', fontWeight: 'bold' }}>
              {favoriteModelIds.includes(config.selectedModel) ? '⭐ ' : ''}{config.selectedModel}
            </span>
            {activeCaps.vision && (
              <span className="pill cyan" style={{ fontSize: '7.5px' }} title="Vision / Image Understanding Supported">
                👁️ VISION
              </span>
            )}
            {activeCaps.tools && (
              <span className="pill yellow" style={{ fontSize: '7.5px' }} title="Autonomous Function Calling / Tools Enabled">
                ⚡ TOOLS
              </span>
            )}
            {activeCaps.reasoning && (
              <span className="pill purple" style={{ fontSize: '7.5px' }} title="Deep Chain-of-Thought Reasoning Model">
                🧠 REASONING
              </span>
            )}
            {activeCaps.code && (
              <span className="pill blue" style={{ fontSize: '7.5px' }} title="SRE & DevOps Code Specialist">
                💻 SRE CODE
              </span>
            )}
            {voiceConfig.isHandsFree && (
              <span className="pill yellow" style={{ fontSize: '7.5px' }}>
                📻 HANDS-FREE
              </span>
            )}
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
              className={activeTab === 'voice' ? 'btn-accent' : ''}
              onClick={() => setActiveTab('voice')}
              style={{ fontSize: '8.5px', padding: '1px 5px' }}
            >
              🎙️ Voice
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

        {/* Live Cyber Audio Waveform Visualizer */}
        <CyberAudioVisualizer state={voiceState} height={32} />

        {/* Voice Quick Action Bar */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(2,6,18,0.7)', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          {voiceState === 'listening' ? (
            <button
              onClick={handleStopMic}
              className="btn-accent"
              style={{ background: 'var(--green)', color: '#000', fontSize: '9px', padding: '2px 8px', fontWeight: 'bold' }}
            >
              ⏹ Stop Listening
            </button>
          ) : (
            <button
              onClick={handleStartMic}
              style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--green)', color: 'var(--green)' }}
            >
              🎙️ Voice Input (STT)
            </button>
          )}

          <button
            onClick={() => handleSaveAndSyncVoiceConfig({ ...voiceConfig, isHandsFree: !voiceConfig.isHandsFree })}
            className={voiceConfig.isHandsFree ? 'btn-accent' : ''}
            style={{ fontSize: '9px', padding: '2px 8px' }}
            title="Auto-listen after each AI response for continuous hands-free dialogue"
          >
            📻 Hands-Free: {voiceConfig.isHandsFree ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => handleSaveAndSyncVoiceConfig({ ...voiceConfig, autoSpeak: !voiceConfig.autoSpeak })}
            className={voiceConfig.autoSpeak ? 'btn-accent' : ''}
            style={{ fontSize: '9px', padding: '2px 8px' }}
          >
            🔊 Auto-Speak: {voiceConfig.autoSpeak ? 'ON' : 'OFF'}
          </button>

          {voiceState === 'speaking' && (
            <button
              onClick={handleStopAudio}
              style={{ fontSize: '9px', padding: '2px 6px', color: 'var(--red)', borderColor: 'var(--red)' }}
            >
              🔇 Mute
            </button>
          )}
        </div>

        {/* Quick Tool Calling & DevOps Prompt Chips */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleSendMessage('Run get_system_telemetry and give me a full mission control health report')}
            disabled={isStreaming}
            style={{ fontSize: '8px', padding: '2px 5px' }}
          >
            🔍 System Telemetry
          </button>
          <button
            onClick={() => handleSendMessage('Inspect current docker containers and port mappings using get_docker_status')}
            disabled={isStreaming}
            style={{ fontSize: '8px', padding: '2px 5px' }}
          >
            🐳 Docker Status
          </button>
          <button
            onClick={() => handleSendMessage('Run ping diagnostic against 03.0x101.lol and 1.1.1.1')}
            disabled={isStreaming}
            style={{ fontSize: '8px', padding: '2px 5px' }}
          >
            📡 Ping Diagnostic
          </button>
          <button
            onClick={() => handleSendMessage('Generate a 32-character hex secret token for API authentication')}
            disabled={isStreaming}
            style={{ fontSize: '8px', padding: '2px 5px' }}
          >
            🔑 Generate Secret
          </button>
          <button
            onClick={() => handleSendMessage('Perform Root Cause Analysis (RCA) on any degraded endpoints')}
            disabled={isStreaming}
            style={{ fontSize: '8px', padding: '2px 5px' }}
          >
            🛡️ Incident RCA
          </button>
        </div>

        {/* Chat Message Stream / Tab Content */}
        {activeTab === 'chat' && (
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
                  gap: '3px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '94%'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '8.5px', color: 'var(--fg-muted)', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontWeight: 'bold', color: msg.role === 'user' ? 'var(--cyan)' : 'var(--green)' }}>
                    {msg.role === 'user' ? 'OPERATOR' : `000-COPILOT (${msg.modelUsed || config.selectedModel})`}
                  </span>
                  <span>{msg.timestamp.substring(11, 19)}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleSpeakSingleMessage(msg.content)}
                      style={{ fontSize: '8px', padding: '0 3px', border: 'none', background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}
                      title="Speak this response aloud"
                    >
                      🔊
                    </button>
                  )}
                </div>

                {/* Attached Images Thumbnail Preview in Message */}
                {msg.images && msg.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    {msg.images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          style={{
                            maxWidth: '180px',
                            maxHeight: '120px',
                            borderRadius: '4px',
                            border: '1px solid var(--cyan)',
                            display: 'block',
                            objectFit: 'cover'
                          }}
                        />
                        <span style={{ fontSize: '7.5px', color: 'var(--cyan)', background: 'rgba(0,0,0,0.8)', padding: '1px 3px', borderRadius: '2px', position: 'absolute', bottom: '2px', left: '2px' }}>
                          👁️ {img.name.slice(0, 18)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Autonomous Tool Invocation Cyber Cards */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                    {msg.toolCalls.map(tc => (
                      <div
                        key={tc.id}
                        style={{
                          background: '#040714',
                          border: '1px solid rgba(250, 204, 21, 0.4)',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '8.5px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--yellow)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            ⚡ TOOL INVOCATION: {tc.toolName}()
                          </span>
                          <span style={{ fontSize: '8px', color: tc.status === 'done' ? 'var(--green)' : 'var(--cyan)' }}>
                            ● {tc.status.toUpperCase()}
                          </span>
                        </div>
                        {Object.keys(tc.args).length > 0 && (
                          <pre style={{ margin: '3px 0 0 0', fontSize: '8px', color: 'var(--fg-dim)', fontFamily: 'monospace' }}>
                            {JSON.stringify(tc.args, null, 2)}
                          </pre>
                        )}
                        {tc.result && (
                          <details style={{ marginTop: '4px', fontSize: '8px' }}>
                            <summary style={{ cursor: 'pointer', color: 'var(--green)' }}>
                              ▶ View Output Result ({JSON.stringify(tc.result).length} B)
                            </summary>
                            <pre style={{ margin: '4px 0 0 0', maxHeight: '100px', overflowY: 'auto', background: '#010204', padding: '4px', borderRadius: '3px', color: 'var(--fg)' }}>
                              {JSON.stringify(tc.result, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Message Bubble */}
                {msg.content && (
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
                )}
              </div>
            ))}
            {isStreaming && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'var(--cyan)' }}>
                <span className="animate-pulse">● Generating streaming inference & executing tools...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === 'voice' && (
          <div style={{ flex: 1, background: '#020408', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold' }}>
              🎙️ VOICE INTERACTION & DUPLEX WALKIE-TALKIE
            </div>
            <p style={{ fontSize: '9.5px', color: 'var(--fg-dim)', lineHeight: '1.4' }}>
              Conduct bidirectional hands-free conversations with 000-Copilot. When Hands-Free mode is enabled, the microphone activates automatically once the assistant finishes speaking.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#040712', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '4px' }}>
                  Speech-to-Text (STT) Status
                </div>
                <div style={{ fontSize: '9px', color: 'var(--fg)' }}>
                  Engine: <strong style={{ color: 'var(--green)' }}>Web Speech API / Whisper</strong>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--fg)' }}>
                  State: <strong>{voiceState.toUpperCase()}</strong>
                </div>
              </div>

              <div style={{ background: '#040712', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '4px' }}>
                  Text-to-Speech (TTS) Status
                </div>
                <div style={{ fontSize: '9px', color: 'var(--fg)' }}>
                  Engine: <strong style={{ color: 'var(--yellow)' }}>{voiceConfig.ttsEngine === 'openai' ? 'OpenAI /v1/audio/speech' : 'Browser SpeechSynthesis'}</strong>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--fg)' }}>
                  Voice: <strong>{voiceConfig.ttsEngine === 'openai' ? voiceConfig.openaiVoice : (voiceConfig.browserVoiceURI || 'Default')}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-accent"
                onClick={() => handleSpeakSingleMessage('000-Copilot voice synthesis online. Zero-knowledge operations deck active.')}
                style={{ fontSize: '9.5px', padding: '6px 12px' }}
              >
                🔊 Test Voice Output
              </button>
            </div>
          </div>
        )}

        {activeTab === 'context' && (
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

        {/* Attached Images Previews Above Input Bar */}
        {attachedImages.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', padding: '4px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', alignItems: 'center' }}>
            <span style={{ fontSize: '8.5px', color: 'var(--cyan)', fontWeight: 'bold' }}>📎 ATTACHED ({attachedImages.length}):</span>
            {attachedImages.map((img, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#000', padding: '2px 4px', borderRadius: '3px', border: '1px solid var(--border)' }}>
                <img src={img.dataUrl} alt={img.name} style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '2px' }} />
                <span style={{ fontSize: '8px', color: '#fff', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                  style={{ fontSize: '8px', padding: '0 2px', border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar & Multi-modal File Input */}
        <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '6px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0 6px',
              fontSize: '11px',
              borderColor: attachedImages.length > 0 ? 'var(--cyan)' : undefined,
              color: attachedImages.length > 0 ? 'var(--cyan)' : undefined
            }}
            title="Attach image or screenshot (or paste with Ctrl+V)"
          >
            📎
          </button>

          {/* Voice Input Button */}
          <button
            onClick={voiceState === 'listening' ? handleStopMic : handleStartMic}
            className={voiceState === 'listening' ? 'btn-accent' : ''}
            style={{
              padding: '0 8px',
              fontSize: '11px',
              borderColor: voiceState === 'listening' ? 'var(--green)' : undefined,
              color: voiceState === 'listening' ? 'var(--green)' : undefined
            }}
            title="Hold or Click to Speak"
          >
            🎙️
          </button>

          {/* Text Input with Paste listener */}
          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(); }}
            placeholder={
              voiceState === 'listening'
                ? 'Listening to your voice...'
                : activeCaps.vision
                ? 'Ask AI, paste screenshot (Ctrl+V), or query tools...'
                : 'Ask or speak to AI Copilot...'
            }
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
              disabled={!inputPrompt.trim() && attachedImages.length === 0}
              style={{ fontSize: '10px', padding: '0 12px' }}
            >
              Send ⏎
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Connection, Saved Providers & Filterable Models */}
      <div className="workbench-right" style={{ padding: '8px', gap: '7px' }}>
        <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
          ⚙️ AI PROVIDERS & MODEL REGISTRY
        </div>

        {/* Saved Provider Profiles Selector & Manager */}
        <div style={{ background: '#030712', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--cyan)' }}>
                🗂️ SAVED PROVIDERS ({savedProfiles.length})
              </span>
              <button
                type="button"
                onClick={(e) => handleToggleFavoriteProvider(config.activeProviderId || 'ollama', e)}
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  border: 'none',
                  background: 'transparent',
                  color: favoriteProviderIds.includes(config.activeProviderId || 'ollama') ? 'var(--yellow)' : 'var(--fg-dim)',
                  cursor: 'pointer'
                }}
                title="Добавить текущего провайдера в избранное"
              >
                {favoriteProviderIds.includes(config.activeProviderId || 'ollama') ? '⭐ В избранном' : '☆ В избранное'}
              </button>
            </div>

            <button
              onClick={() => setIsSavingProfile(!isSavingProfile)}
              style={{ fontSize: '8px', padding: '1px 5px', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
            >
              {isSavingProfile ? '✕ Cancel' : '+ Save Profile'}
            </button>
          </div>

          {/* Quick Favorite Provider Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '7.5px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>⭐ ИЗБРАННЫЕ ПРОВАЙДЕРЫ ({savedProfiles.filter(p => favoriteProviderIds.includes(p.id)).length}):</span>
            </div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {savedProfiles
                .filter(p => favoriteProviderIds.includes(p.id))
                .map(profile => {
                  const isActive = config.activeProviderId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleSelectProviderProfile(profile.id)}
                      style={{
                        fontSize: '8px',
                        padding: '2px 5px',
                        background: isActive ? 'rgba(250, 204, 21, 0.25)' : 'rgba(250, 204, 21, 0.08)',
                        borderColor: isActive ? 'var(--yellow)' : 'rgba(250, 204, 21, 0.4)',
                        color: isActive ? 'var(--yellow)' : '#fff',
                        fontWeight: isActive ? 'bold' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title={`Switch to ${profile.name} (${profile.baseUrl})`}
                    >
                      <span>⭐</span>
                      <span>{profile.name.replace(' (Local / VPS)', '').replace(' Local', '')}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select
              value={config.activeProviderId || ''}
              onChange={e => handleSelectProviderProfile(e.target.value)}
              style={{ flex: 1, fontSize: '9px', padding: '3px 6px', background: '#050a18', color: 'var(--cyan)', fontWeight: 'bold' }}
            >
              {savedProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {favoriteProviderIds.includes(p.id) ? '⭐ ' : ''}{p.isCustom ? '[Custom] ' : '⚡ '} {p.name}
                </option>
              ))}
            </select>

            {/* Quick Star Toggle Button next to select */}
            <button
              type="button"
              onClick={(e) => handleToggleFavoriteProvider(config.activeProviderId || 'ollama', e)}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderColor: favoriteProviderIds.includes(config.activeProviderId || '') ? 'var(--yellow)' : 'var(--border)',
                color: favoriteProviderIds.includes(config.activeProviderId || '') ? 'var(--yellow)' : 'var(--fg-dim)'
              }}
              title="Переключить избранное для активного провайдера"
            >
              {favoriteProviderIds.includes(config.activeProviderId || '') ? '⭐' : '☆'}
            </button>

            {activeProfile?.isCustom && (
              <button
                onClick={() => handleDeleteProfile(activeProfile.id)}
                style={{ fontSize: '8px', padding: '2px 5px', color: 'var(--red)', borderColor: 'var(--red)' }}
                title="Delete saved custom profile"
              >
                🗑️
              </button>
            )}
          </div>

          {/* Inline Save Profile Form */}
          {isSavingProfile && (
            <div style={{ display: 'flex', gap: '4px', background: '#02040a', padding: '4px', borderRadius: '3px', border: '1px dashed var(--cyan)', marginTop: '2px' }}>
              <input
                type="text"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveCurrentAsProfile(); }}
                placeholder="Profile name (e.g. Ollama Qwen-32B, Tooken.club, VPS vLLM)..."
                style={{ flex: 1, fontSize: '8.5px', padding: '2px 4px' }}
              />
              <button
                className="btn-accent"
                onClick={handleSaveCurrentAsProfile}
                disabled={!newProfileName.trim()}
                style={{ fontSize: '8.5px', padding: '2px 6px' }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* 1-Click Provider Quick Presets */}
        <div>
          <div style={{ fontSize: '8.5px', color: 'var(--fg-muted)', marginBottom: '2px' }}>QUICK PRESETS</div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {AI_PROVIDER_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                style={{
                  fontSize: '8px',
                  padding: '1px 4px',
                  borderColor: config.activeProviderId === preset.id ? 'var(--cyan)' : undefined,
                  color: config.activeProviderId === preset.id ? 'var(--cyan)' : undefined
                }}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Dedicated Ollama Local Connection & Diagnostics Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(15, 23, 42, 0.9))',
            border: config.baseUrl.includes('11434') ? '1px solid var(--cyan)' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            padding: '7px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🦙</span>
              <span>OLLAMA LOCAL (QWEN-CODER-32B)</span>
            </span>
            <span className={`pill ${config.baseUrl.includes('11434') ? 'green' : 'dim'}`} style={{ fontSize: '7.5px' }}>
              {config.baseUrl.includes('11434') ? '● ACTIVE ENGINE' : 'OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-accent"
              onClick={() => handleQuickConnectOllama('http://localhost:11434/v1')}
              style={{ fontSize: '8px', padding: '2px 6px' }}
            >
              🔌 Подключить (localhost:11434)
            </button>
            <button
              type="button"
              onClick={() => handleQuickConnectOllama('http://127.0.0.1:11434/v1')}
              style={{ fontSize: '8px', padding: '2px 6px', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
            >
              🔌 Подключить (127.0.0.1:11434)
            </button>
            <button
              type="button"
              onClick={() => setShowOllamaGuide(!showOllamaGuide)}
              style={{ fontSize: '8px', padding: '2px 5px', color: 'var(--yellow)', borderColor: 'var(--yellow)' }}
              title="Инструкция по настройке OLLAMA_ORIGINS"
            >
              {showOllamaGuide ? '✕ Скрыть помощь' : 'ℹ️ Инструкция CORS'}
            </button>
          </div>

          {/* Collapsible Ollama Setup Guide */}
          {showOllamaGuide && (
            <div
              style={{
                background: '#02040a',
                border: '1px dashed var(--yellow)',
                borderRadius: '4px',
                padding: '6px',
                fontSize: '8px',
                fontFamily: 'monospace',
                color: 'var(--fg-dim)',
                lineHeight: '1.4',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginTop: '2px'
              }}
            >
              <div style={{ color: 'var(--yellow)', fontWeight: 'bold' }}>
                💡 Настройка доступа браузера к локальной Ollama (CORS):
              </div>
              <div>
                1. <strong>Запуск модели:</strong>
                <div style={{ background: '#090d1a', padding: '2px 4px', color: 'var(--green)', borderRadius: '2px', margin: '2px 0' }}>
                  ollama run qwen-coder-32b-abliterated
                </div>
              </div>
              <div>
                2. <strong>Разрешить CORS для браузера:</strong>
                <div style={{ background: '#090d1a', padding: '2px 4px', color: 'var(--cyan)', borderRadius: '2px', margin: '2px 0' }}>
                  Windows (CMD/PowerShell): set OLLAMA_ORIGINS=* & ollama serve<br />
                  Linux/macOS: OLLAMA_ORIGINS="*" ollama serve
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Base URL Configuration */}
        <div>
          <label style={{ fontSize: '8.5px', color: 'var(--fg-muted)', display: 'block', marginBottom: '2px' }}>
            BASE URL
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              value={config.baseUrl}
              onChange={e => handleSaveAndSyncConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://tooken.club/v1 or http://localhost:11434/v1"
              style={{ flex: 1, fontSize: '9px', fontFamily: 'monospace' }}
            />
            <button
              className="btn-accent"
              onClick={() => handleFetchModels(config.baseUrl, config.apiKey)}
              disabled={isFetchingModels}
              style={{ fontSize: '8.5px', padding: '0 6px', whiteSpace: 'nowrap' }}
            >
              {isFetchingModels ? 'Syncing...' : '🔄 Sync'}
            </button>
          </div>
        </div>

        {/* API Key Configuration */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <label style={{ fontSize: '8.5px', color: 'var(--fg-muted)' }}>
              API KEY / BEARER TOKEN
            </label>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{ fontSize: '7.5px', padding: '0 3px' }}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={e => handleSaveAndSyncConfig({ ...config, apiKey: e.target.value })}
            placeholder="sk-or-v1-... or leave blank for local"
            style={{ width: '100%', fontSize: '9px', fontFamily: 'monospace' }}
          />
        </div>

        {/* Active Selected Model & Quick Favorite Model Chips */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <label style={{ fontSize: '8.5px', color: 'var(--fg-muted)' }}>
              ACTIVE MODEL ID
            </label>
            <button
              type="button"
              onClick={(e) => handleToggleFavorite(config.selectedModel, e)}
              style={{ fontSize: '8px', padding: '0 4px', border: 'none', background: 'transparent', color: favoriteModelIds.includes(config.selectedModel) ? 'var(--yellow)' : 'var(--fg-dim)', cursor: 'pointer' }}
              title="Toggle star for active model"
            >
              {favoriteModelIds.includes(config.selectedModel) ? '⭐ Favorited' : '☆ Star Model'}
            </button>
          </div>
          <input
            type="text"
            value={config.selectedModel}
            onChange={e => handleSaveAndSyncConfig({ ...config, selectedModel: e.target.value })}
            placeholder="e.g. gpt-4o, claude-3-5-sonnet, deepseek-r1..."
            style={{ width: '100%', fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--cyan)', fontWeight: 'bold' }}
          />
          {/* Quick Favorite Chips */}
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '3px' }}>
            {favoriteModelIds.slice(0, 8).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  soundFx.playClick(900);
                  handleSaveAndSyncConfig({ ...config, selectedModel: m });
                }}
                style={{
                  fontSize: '7.5px',
                  padding: '1px 4px',
                  background: config.selectedModel === m ? 'rgba(56, 189, 248, 0.2)' : undefined,
                  borderColor: config.selectedModel === m ? 'var(--cyan)' : undefined,
                  color: config.selectedModel === m ? 'var(--cyan)' : undefined
                }}
                title={`Select ${m}`}
              >
                ⭐ {m.split('/').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {fetchError && (
          <div style={{ padding: '4px 6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '8px', borderRadius: '4px', lineHeight: '1.3' }}>
            <div>⚠️ {fetchError}</div>
          </div>
        )}

        {/* Model Filter Pills & Discovered Models Registry */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '110px' }}>
          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginBottom: '3px' }}>
            {[
              { id: 'all', label: 'All', icon: '🌐' },
              { id: 'favorites', label: `⭐ Fav (${favoriteModelIds.length})`, icon: '' },
              { id: 'vision', label: 'Vision', icon: '👁️' },
              { id: 'tools', label: 'Tools', icon: '⚡' },
              { id: 'reasoning', label: 'Reasoning', icon: '🧠' },
              { id: 'code', label: 'Code', icon: '💻' }
            ].map(f => {
              const isActive = selectedFilterCategory === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick(900);
                    setSelectedFilterCategory(f.id as any);
                  }}
                  style={{
                    fontSize: '7.5px',
                    padding: '1px 4px',
                    background: isActive ? (f.id === 'favorites' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(56, 189, 248, 0.25)') : undefined,
                    borderColor: isActive ? (f.id === 'favorites' ? 'var(--yellow)' : 'var(--cyan)') : undefined,
                    color: isActive ? (f.id === 'favorites' ? 'var(--yellow)' : 'var(--cyan)') : 'var(--fg-muted)',
                    fontWeight: isActive ? 'bold' : 'normal'
                  }}
                >
                  {f.icon ? `${f.icon} ` : ''}{f.label}
                </button>
              );
            })}
          </div>

          {/* Search Filter Input & Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '8px', color: 'var(--fg-muted)' }}>
              MODELS ({filteredModels.length}/{availableModels.length})
            </span>
            <input
              type="text"
              value={modelFilter}
              onChange={e => setModelFilter(e.target.value)}
              placeholder="Search..."
              style={{ width: '90px', fontSize: '8px', padding: '1px 3px' }}
            />
          </div>

          <div
            style={{
              flex: 1,
              background: '#020306',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              overflowY: 'auto',
              maxHeight: '110px'
            }}
          >
            {filteredModels.length > 0 ? (
              filteredModels.map(m => {
                const isSelected = m.id === config.selectedModel;
                const isFav = favoriteModelIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      soundFx.playClick(900);
                      handleSaveAndSyncConfig({ ...config, selectedModel: m.id });
                    }}
                    style={{
                      padding: '2px 5px',
                      fontSize: '8.5px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--cyan)' : 'var(--fg)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, overflow: 'hidden' }}>
                      {/* Star Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(m.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0 1px',
                          cursor: 'pointer',
                          fontSize: '9px',
                          color: isFav ? 'var(--yellow)' : 'var(--fg-dim)',
                          lineHeight: 1
                        }}
                        title={isFav ? 'Remove from favorites' : 'Star as favorite'}
                      >
                        {isFav ? '⭐' : '☆'}
                      </button>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isSelected ? '✓ ' : ''}{m.id}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                      {m.capabilities.vision && <span title="Vision" style={{ fontSize: '7px', color: 'var(--cyan)' }}>👁️</span>}
                      {m.capabilities.tools && <span title="Tools" style={{ fontSize: '7px', color: 'var(--yellow)' }}>⚡</span>}
                      {m.capabilities.reasoning && <span title="Reasoning" style={{ fontSize: '7px', color: 'var(--purple)' }}>🧠</span>}
                      {m.capabilities.code && <span title="Code" style={{ fontSize: '7px', color: 'var(--blue)' }}>💻</span>}
                      <span style={{ fontSize: '7px', color: 'var(--fg-muted)' }}>{m.owned_by}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '8px', textAlign: 'center', color: 'var(--fg-dim)', fontSize: '8px' }}>
                {selectedFilterCategory === 'favorites'
                  ? 'No favorite models yet. Click ☆ next to any model to star it!'
                  : isFetchingModels
                  ? 'Connecting to /v1/models...'
                  : 'No models matched your filter.'}
              </div>
            )}
          </div>
        </div>

        {/* Autonomous Tool Calling & Capabilities Profile */}
        <div style={{ background: '#02040a', border: '1px solid var(--border)', borderRadius: '4px', padding: '5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: 'var(--yellow)' }}>
              ⚡ TOOL CALLING & CAPABILITIES
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.enableTools}
                onChange={e => handleSaveAndSyncConfig({ ...config, enableTools: e.target.checked })}
              />
              <span>Enabled</span>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '7.5px', color: 'var(--fg-dim)' }}>
            <div>Vision: <strong style={{ color: activeCaps.vision ? 'var(--cyan)' : 'var(--fg-muted)' }}>{activeCaps.vision ? '✓ Active' : '✕ No'}</strong></div>
            <div>Tools: <strong style={{ color: activeCaps.tools ? 'var(--yellow)' : 'var(--fg-muted)' }}>{activeCaps.tools ? '✓ Supported' : '✕ No'}</strong></div>
            <div>Reasoning: <strong style={{ color: activeCaps.reasoning ? 'var(--purple)' : 'var(--fg-muted)' }}>{activeCaps.reasoning ? '✓ CoT' : '✕ Standard'}</strong></div>
            <div>Context: <strong style={{ color: 'var(--green)' }}>{Math.round(activeCaps.contextWindow / 1000)}k tokens</strong></div>
          </div>
        </div>

        {/* Voice Synthesis & Audio Settings */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 'bold' }}>
            🎙️ VOICE & TTS CONFIGURATION
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div>
              <label style={{ fontSize: '8.5px', color: 'var(--fg-muted)', display: 'block' }}>TTS ENGINE</label>
              <select
                value={voiceConfig.ttsEngine}
                onChange={e => handleSaveAndSyncVoiceConfig({ ...voiceConfig, ttsEngine: e.target.value as any })}
                style={{ width: '100%', fontSize: '8.5px' }}
              >
                <option value="browser">Browser SpeechSynthesis</option>
                <option value="openai">OpenAI /v1/audio/speech</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8.5px', color: 'var(--fg-muted)', display: 'block' }}>VOICE SELECTOR</label>
              {voiceConfig.ttsEngine === 'openai' ? (
                <select
                  value={voiceConfig.openaiVoice}
                  onChange={e => handleSaveAndSyncVoiceConfig({ ...voiceConfig, openaiVoice: e.target.value as any })}
                  style={{ width: '100%', fontSize: '8.5px' }}
                >
                  {OPENAI_VOICES.map(v => (
                    <option key={v} value={v}>{v.toUpperCase()}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={voiceConfig.browserVoiceURI}
                  onChange={e => handleSaveAndSyncVoiceConfig({ ...voiceConfig, browserVoiceURI: e.target.value })}
                  style={{ width: '100%', fontSize: '8.5px' }}
                >
                  <option value="">Default System Voice</option>
                  {browserVoicesList.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--fg-muted)' }}>
                <span>SPEED RATE</span>
                <span>{voiceConfig.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={voiceConfig.speechRate}
                onChange={e => handleSaveAndSyncVoiceConfig({ ...voiceConfig, speechRate: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '8.5px', color: 'var(--fg-muted)', display: 'block' }}>STT LANGUAGE</label>
              <select
                value={voiceConfig.sttLanguage}
                onChange={e => handleSaveAndSyncVoiceConfig({ ...voiceConfig, sttLanguage: e.target.value })}
                style={{ width: '100%', fontSize: '8.5px' }}
              >
                <option value="ru-RU">Русский (ru-RU)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
