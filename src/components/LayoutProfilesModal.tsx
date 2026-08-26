import React, { useState } from 'react';
import { soundFx } from '../services/soundFx';

interface LayoutProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutStyle: 'grid' | 'master' | 'rows';
  setLayoutStyle: (s: 'grid' | 'master' | 'rows') => void;
  colsMode: number;
  setColsMode: (c: number) => void;
  density: 'standard' | 'nano';
  setDensity: (d: 'standard' | 'nano') => void;
  theme: 'cyber' | 'matrix' | 'amber' | 'mono';
  setTheme: (t: 'cyber' | 'matrix' | 'amber' | 'mono') => void;
  onApplyPreset: (name: string, ids: string[]) => void;
  onSaveSlot: (slotNum: number) => void;
  onLoadSlot: (slotNum: number) => boolean;
}

export const LayoutProfilesModal: React.FC<LayoutProfilesModalProps> = ({
  isOpen,
  onClose,
  layoutStyle,
  setLayoutStyle,
  colsMode,
  setColsMode,
  density,
  setDensity,
  theme,
  setTheme,
  onApplyPreset,
  onSaveSlot,
  onLoadSlot,
}) => {
  const [slotMsg, setSlotMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'devops',
      title: '🚀 DevOps & SRE Cockpit',
      desc: 'Projects Table, Health Matrix, CLI Terminal, Quick Runbooks, Audit Log, ASCII Topology',
      modules: ['A1', 'D1', 'E1', 'E2', 'F1', 'G2'],
      style: 'grid' as const,
      cols: 3
    },
    {
      id: 'secops',
      title: '🛡️ SecOps & Zero-Knowledge Vault',
      desc: 'Encrypted Secrets Vault, Key Generator, Audit Ledger, DEFCON Controls, Hash Verifier',
      modules: ['B1', 'B4', 'F1', 'F2', 'C5', 'C4'],
      style: 'grid' as const,
      cols: 2
    },
    {
      id: 'noc',
      title: '📡 NOC & High-Density Observability',
      desc: 'Health Matrix, Uptime SLA Metric, Latency Sparklines, Ping Tester, ASCII Topology, Clock',
      modules: ['D1', 'D2', 'D3', 'D4', 'G2', 'H1'],
      style: 'master' as const,
      cols: 2
    },
    {
      id: 'hacker',
      title: '⚡ Full 70-Module Mission Control',
      desc: 'Maximum operational density: Projects, Vault, Health, Terminal, Audit, Artifacts, Notepad',
      modules: ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G2', 'H1', 'H2'],
      style: 'grid' as const,
      cols: 4
    },
    {
      id: 'lite',
      title: '📝 Minimal Developer Scratchpad',
      desc: 'Projects, Quick Access Dock, CLI Terminal, Markdown Notepad IDE',
      modules: ['A1', 'A4', 'E1', 'H2'],
      style: 'grid' as const,
      cols: 2
    }
  ];

  const handleSlotSave = (slot: number) => {
    soundFx.playDeploySuccess();
    onSaveSlot(slot);
    setSlotMsg(`[✓ SAVED] Current layout saved to Slot #${slot}`);
    setTimeout(() => setSlotMsg(null), 2500);
  };

  const handleSlotLoad = (slot: number) => {
    const ok = onLoadSlot(slot);
    if (ok) {
      soundFx.playDeploySuccess();
      setSlotMsg(`[✓ LOADED] Layout Slot #${slot} applied`);
      setTimeout(() => setSlotMsg(null), 2500);
    } else {
      soundFx.playAlarm();
      setSlotMsg(`[!] Slot #${slot} is empty`);
      setTimeout(() => setSlotMsg(null), 2500);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal profiles-modal" style={{ maxWidth: '680px', width: '95%' }}>
        <div className="modal-header">
          <span>⚙ WORKSPACE PROFILES, THEMES & LAYOUT CUSTOMIZER</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#888' }}>[ESC / ×]</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '75vh' }}>
          {/* 1. ROLE PRESETS */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
              1. PRE-CONFIGURED ROLE WORKSPACES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {presets.map(p => (
                <div 
                  key={p.id}
                  style={{
                    background: 'var(--bg-tile)',
                    border: '1px solid var(--border)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    soundFx.playDeploySuccess();
                    setLayoutStyle(p.style);
                    setColsMode(p.cols);
                    onApplyPreset(p.title, p.modules);
                    onClose();
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{p.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--fg-dim)' }}>{p.desc}</div>
                  </div>
                  <button className="btn-accent" style={{ flexShrink: 0 }}>
                    [Apply Preset]
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. GRID LAYOUT STYLE & COLUMNS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '6px' }}>
                2. LAYOUT GRID STYLE
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button 
                  className={layoutStyle === 'grid' ? 'btn-accent' : ''}
                  onClick={() => { soundFx.playClick(900); setLayoutStyle('grid'); }}
                >
                  [Tiling Columns]
                </button>
                <button 
                  className={layoutStyle === 'master' ? 'btn-accent' : ''}
                  onClick={() => { soundFx.playClick(900); setLayoutStyle('master'); }}
                >
                  [Master-Stack (DWM)]
                </button>
                <button 
                  className={layoutStyle === 'rows' ? 'btn-accent' : ''}
                  onClick={() => { soundFx.playClick(900); setLayoutStyle('rows'); }}
                >
                  [Horizontal Rows]
                </button>
              </div>
            </div>

            {/* 3. DENSITY & FONT */}
            <div style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '6px' }}>
                3. UI DENSITY MODE
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button 
                  className={density === 'standard' ? 'btn-accent' : ''}
                  onClick={() => { soundFx.playClick(900); setDensity('standard'); }}
                >
                  [Standard 11px]
                </button>
                <button 
                  className={density === 'nano' ? 'btn-accent' : ''}
                  onClick={() => { soundFx.playClick(900); setDensity('nano'); }}
                >
                  [TUI Nano 9.5px (Max Density)]
                </button>
              </div>
            </div>
          </div>

          {/* 4. COLOR THEME PALETTES */}
          <div style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: '4px' }}>
            <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '6px' }}>
              4. CONSOLE PHOSPHOR THEMES
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                className={theme === 'cyber' ? 'btn-accent' : ''}
                onClick={() => { soundFx.playClick(900); setTheme('cyber'); }}
              >
                🔵 Cyber Cyan (Default)
              </button>
              <button 
                className={theme === 'matrix' ? 'btn-accent' : ''}
                onClick={() => { soundFx.playClick(900); setTheme('matrix'); }}
                style={{ color: '#00ff66' }}
              >
                🟢 Matrix Phosphor Green
              </button>
              <button 
                className={theme === 'amber' ? 'btn-accent' : ''}
                onClick={() => { soundFx.playClick(900); setTheme('amber'); }}
                style={{ color: '#ffb000' }}
              >
                🟠 Retro CRT Amber
              </button>
              <button 
                className={theme === 'mono' ? 'btn-accent' : ''}
                onClick={() => { soundFx.playClick(900); setTheme('mono'); }}
                style={{ color: '#ffffff' }}
              >
                ⚪ Monochrome Minimal
              </button>
            </div>
          </div>

          {/* 5. USER CUSTOM SLOTS (Save/Load) */}
          <div style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold' }}>5. USER CUSTOM MEMORY SLOTS</span>
              {slotMsg && <span style={{ color: 'var(--green)', fontSize: '10px', fontWeight: 'bold' }}>{slotMsg}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[1, 2, 3].map(slot => (
                <div key={slot} style={{ background: '#000', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--fg-dim)', fontWeight: 'bold' }}>SLOT #{slot}</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button onClick={() => handleSlotSave(slot)} style={{ flex: 1 }}>[Save]</button>
                    <button onClick={() => handleSlotLoad(slot)} className="btn-accent" style={{ flex: 1 }}>[Load]</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
          <span style={{ fontSize: '10px', color: 'var(--fg-dim)' }}>All preferences auto-saved in local persistence</span>
          <button className="btn-accent" onClick={onClose}>[✓ Close & Return to Deck]</button>
        </div>
      </div>
    </div>
  );
};
