import React from 'react';
import { useTools } from '../../context/ToolsContext';
import { useVault } from '../../context/VaultContext';
import { soundFx } from '../../services/soundFx';

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
    setJsonFormatted
  } = useTools();

  const { generateRandomKey } = useVault();

  if (!isBubbleOpen) return null;

  return (
    <aside className="floating-hud-bubble">
      <div className="bubble-header">
        <span>⚡ QUICK FLYOUT TOOLKIT</span>
        <button onClick={() => setIsBubbleOpen(false)} style={{ border: 'none', background: 'transparent', color: '#888' }}>[×]</button>
      </div>

      <div className="bubble-tabs">
        <button className={bubbleTool === 'ping' ? 'active' : ''} onClick={() => setBubbleTool('ping')}>[Ping Tester]</button>
        <button className={bubbleTool === 'gen' ? 'active' : ''} onClick={() => setBubbleTool('gen')}>[Token Gen]</button>
        <button className={bubbleTool === 'hash' ? 'active' : ''} onClick={() => setBubbleTool('hash')}>[SHA Verifier]</button>
        <button className={bubbleTool === 'b64' ? 'active' : ''} onClick={() => setBubbleTool('b64')}>[Base64]</button>
        <button className={bubbleTool === 'json' ? 'active' : ''} onClick={() => setBubbleTool('json')}>[JSON]</button>
      </div>

      <div className="bubble-content">
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
