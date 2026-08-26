import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { soundFx } from '../../services/soundFx';

export const SecretsVaultWidget: React.FC = () => {
  const { secrets, setIsPasswordModalOpen } = useDashboard();
  const { 
    isVaultUnlocked, 
    revealedSecrets, 
    animatingSecrets, 
    copiedKeyId, 
    handleToggleReveal, 
    handleCopySecret, 
    lockVault 
  } = useVault();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span className={`pill ${isVaultUnlocked ? 'green' : 'yellow'}`}>
          {isVaultUnlocked ? 'UNLOCKED (AES-256)' : 'LOCKED (ZERO-KNOWLEDGE)'}
        </span>
        {isVaultUnlocked ? (
          <button onClick={() => { soundFx.playLock(); lockVault(); }}>[Lock]</button>
        ) : (
          <button className="btn-accent" onClick={() => setIsPasswordModalOpen(true)}>[Unlock Passkey]</button>
        )}
      </div>

      {secrets.map(s => {
        const isRev = revealedSecrets[s.id];
        const anim = animatingSecrets[s.id];
        const displayVal = !isVaultUnlocked 
          ? '••••••••••••••••' 
          : anim ? anim : isRev ? s.value : '••••••••••••••••';

        return (
          <div key={s.id} className="tui-row">
            <div style={{ minWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{s.name}</span>
            </div>
            <div style={{ color: 'var(--fg-dim)', background: '#000', padding: '0 4px', border: '1px solid var(--border)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayVal}
            </div>
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <button onClick={() => handleToggleReveal(s.id, s.value)}>{isRev ? 'Mask' : 'Rev'}</button>
              <button onClick={() => handleCopySecret(s.id, s.value)} style={{ color: copiedKeyId === s.id ? 'var(--green)' : undefined }}>
                {copiedKeyId === s.id ? 'OK!' : 'Copy'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
