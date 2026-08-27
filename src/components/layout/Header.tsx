import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { useTools } from '../../context/ToolsContext';
import { useSystemClock } from '../../hooks/useSystemClock';
import { DefconLevel } from '../../types';
import { soundFx } from '../../services/soundFx';

export const Header: React.FC = () => {
  const { 
    layoutStyle, 
    setLayoutStyle, 
    colsMode, 
    defcon, 
    setDefcon, 
    soundOn, 
    setSoundOn, 
    activeModuleIds,
    setIsLayoutModalOpen, 
    setIsPickerOpen, 
    setIsSpotlightOpen, 
    setIsPasswordModalOpen 
  } = useDashboard();

  const { isVaultUnlocked, lockVault } = useVault();
  const { addLog } = useTools();
  const { timeUtc } = useSystemClock();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-left">
          <span style={{ color: 'var(--cyan)', fontWeight: 900, cursor: 'pointer' }} onClick={() => setIsLayoutModalOpen(true)}>
            000 // COMMAND DECK
          </span>
          <span className="pill green hide-on-mobile">000.localhost:3000</span>
          
          {/* Columns Selector (Desktop) */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>LAYOUT:</span>
            <button 
              className={layoutStyle === 'grid' ? 'btn-accent' : ''}
              onClick={() => setLayoutStyle('grid')}
              style={{ height: '16px', padding: '0 4px', fontSize: '9px' }}
            >
              GRID ({colsMode})
            </button>
            <button 
              className={layoutStyle === 'master' ? 'btn-accent' : ''}
              onClick={() => setLayoutStyle('master')}
              style={{ height: '16px', padding: '0 4px', fontSize: '9px' }}
            >
              MASTER
            </button>
            <button 
              className={layoutStyle === 'rows' ? 'btn-accent' : ''}
              onClick={() => setLayoutStyle('rows')}
              style={{ height: '16px', padding: '0 4px', fontSize: '9px' }}
            >
              ROWS
            </button>
          </div>

          {/* DEFCON Selector (Desktop) */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>DEFCON:</span>
            {([5, 4, 3, 2, 1] as DefconLevel[]).map(l => (
              <button
                key={l}
                onClick={() => {
                  soundFx.playClick(600 + l * 80);
                  if (l === 1) soundFx.playAlarm();
                  setDefcon(l);
                  addLog('DEFCON', `Switched to DEFCON ${l}`, l === 1 ? 'critical' : 'warn');
                }}
                style={{
                  height: '16px',
                  width: '16px',
                  padding: 0,
                  background: defcon === l ? (l === 1 ? 'var(--red)' : l <= 3 ? 'var(--yellow)' : 'var(--green)') : undefined,
                  color: defcon === l ? '#000' : undefined,
                  fontWeight: defcon === l ? 900 : undefined
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="top-bar-right">
          <span style={{ color: 'var(--cyan)' }}>{timeUtc}</span>

          {/* Mobile Menu Toggle Button */}
          <button
            className="show-on-mobile"
            onClick={() => {
              soundFx.playClick(800);
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            style={{ padding: '2px 6px', fontSize: '10px' }}
          >
            {isMobileMenuOpen ? '✕' : '☰ DEFCON'}
          </button>
          
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {isVaultUnlocked ? (
              <button onClick={() => { soundFx.playLock(); lockVault(); }} style={{ color: 'var(--yellow)', borderColor: 'var(--yellow)' }}>
                [VAULT: UNLOCKED]
              </button>
            ) : (
              <button onClick={() => setIsPasswordModalOpen(true)}>
                [VAULT: LOCKED]
              </button>
            )}

            {/* Layout Profiles / Themes Button */}
            <button className="btn-accent" onClick={() => setIsLayoutModalOpen(true)}>
              [F9: PRESETS & THEMES]
            </button>

            {/* Module Catalog Button */}
            <button onClick={() => setIsPickerOpen(true)}>
              [F8: MODULES ({activeModuleIds.length}/70)]
            </button>

            <button onClick={() => setIsSpotlightOpen(true)}>
              [Ctrl+K]
            </button>

            <button onClick={() => setSoundOn(!soundOn)}>
              {soundOn ? '[SFX]' : '[MUTE]'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-header-drawer show-on-mobile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--fg-muted)' }}>DEFCON DEFENSE LEVEL:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {([5, 4, 3, 2, 1] as DefconLevel[]).map(l => (
                <button
                  key={l}
                  onClick={() => {
                    soundFx.playClick(600 + l * 80);
                    if (l === 1) soundFx.playAlarm();
                    setDefcon(l);
                    addLog('DEFCON', `Switched to DEFCON ${l}`, l === 1 ? 'critical' : 'warn');
                  }}
                  style={{
                    height: '24px',
                    width: '28px',
                    fontSize: '11px',
                    background: defcon === l ? (l === 1 ? 'var(--red)' : l <= 3 ? 'var(--yellow)' : 'var(--green)') : undefined,
                    color: defcon === l ? '#000' : undefined,
                    fontWeight: 'bold'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button
              className="btn-accent"
              onClick={() => {
                setIsLayoutModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              style={{ flex: 1, marginRight: '6px', padding: '6px', fontSize: '10px' }}
            >
              🎨 Themes & Layouts
            </button>
            <button
              onClick={() => setSoundOn(!soundOn)}
              style={{ padding: '6px 12px', fontSize: '10px' }}
            >
              {soundOn ? '🔊 SFX: ON' : '🔇 SFX: OFF'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
