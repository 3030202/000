import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

export const Footer: React.FC = () => {
  const { setIsLayoutModalOpen } = useDashboard();
  const { isBubbleOpen, setIsBubbleOpen } = useTools();

  return (
    <footer className="status-bar">
      <div className="hotkeys-list">
        <span className="hotkey-item"><kbd>F9</kbd> Layout Profiles & Themes</span>
        <span className="hotkey-item"><kbd>F8</kbd> Modules Catalog</span>
        <span className="hotkey-item"><kbd>F1-F4</kbd> Grid Cols</span>
        <span className="hotkey-item"><kbd>` / ~</kbd> Quick Tool Bubble</span>
        <span className="hotkey-item"><kbd>Ctrl+K</kbd> Search</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button 
          className="btn-accent"
          onClick={() => setIsLayoutModalOpen(true)}
        >
          ⚙ [Presets / Themes (F9)]
        </button>
        <button 
          className={`btn-accent ${isBubbleOpen ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick(1000);
            setIsBubbleOpen(p => !p);
          }}
        >
          ⚡ {isBubbleOpen ? '[Close Tool Bubble]' : '[Flyout Tools (~)]'}
        </button>
      </div>
    </footer>
  );
};
