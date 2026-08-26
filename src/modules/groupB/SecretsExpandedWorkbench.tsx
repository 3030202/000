import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

export const SecretsExpandedWorkbench: React.FC = () => {
  const { secrets, selectedSecretId, setSelectedSecretId } = useDashboard();
  const { 
    isVaultUnlocked, 
    revealedSecrets, 
    copiedKeyId, 
    handleToggleReveal, 
    handleCopySecret,
    generateRandomKey
  } = useVault();
  const { genLen, setGenLen, genType, setGenType, genResult, setGenResult } = useTools();

  const curSec = secrets.find(s => s.id === selectedSecretId) || secrets[0];
  if (!curSec) return null;

  const isRev = revealedSecrets[curSec.id];

  return (
    <div className="workbench-split">
      {/* Left Secrets List */}
      <div className="workbench-left">
        <div className="workbench-bar">
          <span>CREDENTIALS LEDGER ({secrets.length})</span>
          <span className={`pill ${isVaultUnlocked ? 'green' : 'yellow'}`}>
            {isVaultUnlocked ? 'UNLOCKED' : 'LOCKED'}
          </span>
        </div>
        <div className="workbench-list">
          {secrets.map(s => (
            <div 
              key={s.id} 
              className={`wb-item-row ${s.id === curSec.id ? 'selected' : ''}`}
              onClick={() => { soundFx.playClick(800); setSelectedSecretId(s.id); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--yellow)' }}>{s.name}</span>
                <span className="pill">{s.category}</span>
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--fg-dim)' }}>{s.service} • Exp: {s.expiresAt || '2028'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Secret Security Inspector */}
      <div className="workbench-right">
        <div className="workbench-bar">
          <span>SECURITY LAB: {curSec.name}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-accent" onClick={() => handleToggleReveal(curSec.id, curSec.value)}>
              {isRev ? '[Mask Value]' : '[Matrix Reveal]'}
            </button>
            <button onClick={() => handleCopySecret(curSec.id, curSec.value)}>
              {copiedKeyId === curSec.id ? '[✓ Copied!]' : '[Copy to Clipboard]'}
            </button>
          </div>
        </div>

        <div className="workbench-detail-body">
          {/* Metric Strip */}
          <div className="exp-metric-grid">
            <div className="exp-metric-box">
              <div className="exp-metric-label">ENCRYPTION</div>
              <div className="exp-metric-val" style={{ color: 'var(--green)' }}>AES-GCM-256</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">ENTROPY STRENGTH</div>
              <div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>256.0 bits</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">TARGET SERVICE</div>
              <div className="exp-metric-val">{curSec.service}</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">KEY EXPIRATION</div>
              <div className="exp-metric-val" style={{ color: 'var(--yellow)' }}>{curSec.expiresAt || 'Persistent'}</div>
            </div>
          </div>

          {/* Full Decrypted / Masked Value Box */}
          <div>
            <div style={{ fontSize: '9.5px', color: 'var(--fg-muted)', marginBottom: '3px' }}>RAW SECRET VALUE BUFFER:</div>
            <textarea 
              rows={4} 
              readOnly 
              value={!isVaultUnlocked ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : (isRev ? curSec.value : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••')}
              style={{ width: '100%', color: 'var(--yellow)', background: '#000', fontSize: '10px' }}
            />
          </div>

          {/* Built-in Token Entropy Generator */}
          <div style={{ background: '#020306', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
            <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '4px' }}>KEY ROTATION & ENTROPY LAB</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={genLen} onChange={e => setGenLen(Number(e.target.value))}>
                <option value={16}>16 chars (128 bits)</option>
                <option value={32}>32 chars (256 bits)</option>
                <option value={64}>64 chars (512 bits)</option>
              </select>
              <select value={genType} onChange={e => setGenType(e.target.value as any)}>
                <option value="alphanumeric">Alphanumeric + Symbols</option>
                <option value="hex">Hexadecimal</option>
              </select>
              <button className="btn-accent" onClick={() => setGenResult(generateRandomKey(genLen, genType))}>
                [Generate Secure Token]
              </button>
              {genResult && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                  <input type="text" readOnly value={genResult} style={{ flex: 1, color: 'var(--yellow)' }} />
                  <button onClick={() => { navigator.clipboard.writeText(genResult); soundFx.playCopy(); }}>[Copy]</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
