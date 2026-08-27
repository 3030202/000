import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

export const MobileBottomNav: React.FC = () => {
  const {
    setIsPickerOpen,
    setIsSpotlightOpen,
    activeModuleIds,
    setActiveModuleIds,
    setZoomedModuleId,
    setIsPasswordModalOpen
  } = useDashboard();

  const { isVaultUnlocked, lockVault } = useVault();
  const { isBubbleOpen, setIsBubbleOpen, setBubbleTool } = useTools();

  const handleOpenAiCopilot = () => {
    soundFx.playClick(900);
    // Ensure E9 is active and zoom into it for full workbench
    if (!activeModuleIds.includes('E9')) {
      setActiveModuleIds(prev => ['E9', ...prev]);
    }
    setZoomedModuleId('E9');
  };

  const handleOpenTools = () => {
    soundFx.playClick(800);
    setIsBubbleOpen(!isBubbleOpen);
    setBubbleTool('ai');
  };

  const handleToggleVault = () => {
    if (isVaultUnlocked) {
      soundFx.playLock();
      lockVault();
    } else {
      soundFx.playClick(1000);
      setIsPasswordModalOpen(true);
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      <button
        onClick={() => {
          soundFx.playClick(700);
          setIsPickerOpen(true);
        }}
        className="mobile-nav-btn"
        title="Modules Catalog (F8)"
      >
        <span className="mobile-nav-icon">🎛️</span>
        <span className="mobile-nav-label">MODULES</span>
      </button>

      <button
        onClick={() => {
          soundFx.playClick(800);
          setIsSpotlightOpen(true);
        }}
        className="mobile-nav-btn"
        title="Spotlight Search (Ctrl+K)"
      >
        <span className="mobile-nav-icon">🔍</span>
        <span className="mobile-nav-label">SEARCH</span>
      </button>

      <button
        onClick={handleOpenAiCopilot}
        className="mobile-nav-btn mobile-nav-btn-highlight"
        title="AI Copilot & Voice"
      >
        <span className="mobile-nav-icon">🤖</span>
        <span className="mobile-nav-label">AI COPILOT</span>
      </button>

      <button
        onClick={handleOpenTools}
        className={`mobile-nav-btn ${isBubbleOpen ? 'active' : ''}`}
        title="Quick Toolkit (~)"
      >
        <span className="mobile-nav-icon">⚡</span>
        <span className="mobile-nav-label">TOOLS</span>
      </button>

      <button
        onClick={handleToggleVault}
        className={`mobile-nav-btn ${isVaultUnlocked ? 'unlocked' : 'locked'}`}
        title="Zero-Knowledge Vault Gate (Режим «ПАПА ДОМА»)"
      >
        <span className="mobile-nav-icon">{isVaultUnlocked ? '👑' : '🔒'}</span>
        <span className="mobile-nav-label">{isVaultUnlocked ? 'ПАПА ДОМА' : 'СЕЙФ'}</span>
      </button>
    </nav>
  );
};
