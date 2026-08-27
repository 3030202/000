import React, { useState } from 'react';
import { useTools } from '../../context/ToolsContext';
import { useVault } from '../../context/VaultContext';
import { soundFx } from '../../services/soundFx';
import { getSavedAiConfig, streamChatCompletion } from '../../services/aiAssistantApi';

export const FloatingTools: React.FC = () => {
  const { 
    isBubbleOpen, 
    setIsBubbleOpen, 
    bubbleTool, 
    setBubbleTool,
    pingInputUrl,
    setPingInputUrl,
    pingOutput,
    handleTestPing,
    genLen,
    setGenLen,
    genType,
    setGenType,
    genResult,
    setGenResult,
    hashInput,
    setHashInput,
    hashResult,
    handleVerifyHash,
    b64Input,
    setB64Input,
    b64Output,
    setB64Output,
    jsonInput,
    setJsonInput,
    jsonFormatted,
    setJsonFormatted,
    addLog
  } = useTools();

  const { generateRandomKey } = useVault();

  // Floating AI Chat State
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('Ask 000-Copilot for instant assistance...');
  const [isAiStreaming, setIsAiStreaming] = useState(false);

  if (!isBubbleOpen) return null;

  const handleAiSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiQuery.trim() || isAiStreaming) return;

    soundFx.playClick(1000);
    const query = aiQuery.trim();
    setAiQuery('');
    setAiAnswer('');
    setIsAiStreaming(true);

    const cfg = getSavedAiConfig();
    let streamAcc = '';
    await streamChatCompletion({
      config: cfg,
      messages: [{ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date().toISOString() }],
      onChunk: (delta) => {
        streamAcc += delta;
        setAiAnswer(streamAcc);
      },
      onDone: (full) => {
        soundFx.playDeploySuccess();
        setIsAiStreaming(false);
        setAiAnswer(full || streamAcc);
        addLog('AI-HUD', `Answered: "${query.slice(0, 25)}"`, 'success');
      },
      onError: (err) => {
        soundFx.playAlarm();
        setIsAiStreaming(false);
        setAiAnswer(`[Error: ${err}] Check Base URL in module E9.`);
        addLog('AI-HUD', `Error: ${err}`, 'warn');
      }
    });
  };

  return (
    <aside className="floating-hud-bubble">
      <div className="bubble-header">
        <span>⚡ QUICK FLYOUT TOOLKIT</span>
        <button onClick={() => setIsBubbleOpen(false)} style={{ border: 'none', background: 'transparent', color: '#888' }}>[×]</button>
      </div>

      <div className="bubble-tabs">
        <button className={bubbleTool === 'ai' ? 'active' : ''} onClick={() => setBubbleTool('ai')}>[🤖 AI Copilot]</button>
        <button className={bubbleTool === 'ping' ? 'active' : ''} onClick={() => setBubbleTool('ping')}>[Ping Tester]</button>
        <button className={bubbleTool === 'gen' ? 'active' : ''} onClick={() => setBubbleTool('gen')}>[Token Gen]</button>
        <button className={bubbleTool === 'hash' ? 'active' : ''} onClick={() => setBubbleTool('hash')}>[SHA Verifier]</button>
        <button className={bubbleTool === 'b64' ? 'active' : ''} onClick={() => setBubbleTool('b64')}>[Base64]</button>
        <button className={bubbleTool === 'json' ? 'active' : ''} onClick={() => setBubbleTool('json')}>[JSON]</button>
      </div>

      <div className="bubble-content">
        {bubbleTool === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                background: '#020306',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '6px',
                fontSize: '9.5px',
                fontFamily: 'monospace',
                color: 'var(--fg)',
                maxHeight: '120px',
                overflowY: 'auto',
                lineHeight: '1.4'
              }}
            >
              {aiAnswer}
              {isAiStreaming && <span className="animate-pulse" style={{ color: 'var(--cyan)' }}> ▋</span>}
            </div>

            <form onSubmit={handleAiSend} style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="Ask 000-Copilot..."
                disabled={isAiStreaming}
                style={{ flex: 1, fontSize: '9.5px' }}
              />
              <button className="btn-accent" type="submit" disabled={isAiStreaming || !aiQuery.trim()}>
                {isAiStreaming ? '...' : '[Ask]'}
              </button>
            </form>
          </div>
        )}

        {bubbleTool === 'ping' && (
          <div>
            <form onSubmit={handleTestPing} style={{ display: 'flex', gap: '4px' }}>
              <input type="text" value={pingInputUrl} onChange={e => setPingInputUrl(e.target.value)} style={{ flex: 1 }} />
              <button className="btn-accent" type="submit">[Send Ping]</button>
            </form>
            {pingOutput && <div style={{ color: 'var(--cyan)', marginTop: '6px', fontSize: '10px' }}>{pingOutput}</div>}
          </div>
        )}

        {bubbleTool === 'gen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select value={genLen} onChange={e => setGenLen(Number(e.target.value))}>
                <option value={16}>16 chars</option>
                <option value={32}>32 chars</option>
                <option value={64}>64 chars</option>
              </select>
              <select value={genType} onChange={e => setGenType(e.target.value as any)}>
                <option value="alphanumeric">Alphanumeric</option>
                <option value="hex">Hexadecimal</option>
              </select>
              <button className="btn-accent" onClick={() => setGenResult(generateRandomKey(genLen, genType))}>[Generate]</button>
            </div>
            {genResult && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="text" readOnly value={genResult} style={{ flex: 1, color: 'var(--yellow)' }} />
                <button onClick={() => { navigator.clipboard.writeText(genResult); soundFx.playCopy(); }}>[Copy]</button>
              </div>
            )}
          </div>
        )}

        {bubbleTool === 'hash' && (
          <form onSubmit={handleVerifyHash} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input type="text" placeholder="Paste SHA-256 hash to test..." value={hashInput} onChange={e => setHashInput(e.target.value)} />
            <button className="btn-accent" type="submit">[Check Integrity]</button>
            {hashResult && <div style={{ color: hashResult.includes('[MATCH]') ? 'var(--green)' : 'var(--red)', fontSize: '10px' }}>{hashResult}</div>}
          </form>
        )}

        {bubbleTool === 'b64' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input type="text" value={b64Input} onChange={e => setB64Input(e.target.value)} placeholder="Plaintext..." />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => {
                try {
                  soundFx.playClick(800);
                  setB64Output(btoa(b64Input));
                } catch {
                  setB64Output('[ERROR]');
                }
              }}>[Encode →]</button>
              <button onClick={() => {
                try {
                  soundFx.playClick(800);
                  setB64Input(atob(b64Output));
                } catch {
                  setB64Input('ERR');
                }
              }}>[← Decode]</button>
            </div>
            <input type="text" value={b64Output} onChange={e => setB64Output(e.target.value)} placeholder="Base64..." />
          </div>
        )}

        {bubbleTool === 'json' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <textarea rows={3} value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder="Raw JSON..." />
            <button className="btn-accent" onClick={() => {
              try {
                setJsonFormatted(JSON.stringify(JSON.parse(jsonInput), null, 2));
                soundFx.playClick(900);
              } catch {
                setJsonFormatted('// ERROR: Invalid JSON');
              }
            }}>[Format & Validate]</button>
            <pre style={{ background: '#000', padding: '4px', border: '1px solid var(--border)', fontSize: '9.5px', maxHeight: '100px', overflowY: 'auto' }}>
              {jsonFormatted}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
};
