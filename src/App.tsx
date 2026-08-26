import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { ToolsProvider, useTools } from './context/ToolsContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/layout/Header';
import { ModuleGrid } from './components/layout/ModuleGrid';
import { FloatingTools } from './components/layout/FloatingTools';
import { Footer } from './components/layout/Footer';
import { ModulePickerModal } from './components/ModulePickerModal';
import { LayoutProfilesModal } from './components/LayoutProfilesModal';
import { SpotlightModal } from './components/SpotlightModal';
import { MasterPasswordModal } from './components/MasterPasswordModal';
import { soundFx } from './services/soundFx';

const DashboardContent: React.FC = () => {
  useKeyboardShortcuts();

  const {
    layoutStyle,
    setLayoutStyle,
    colsMode,
    setColsMode,
    density,
    setDensity,
    theme,
    setTheme,
    activeModuleIds,
    setActiveModuleIds,
    isPickerOpen,
    setIsPickerOpen,
    isLayoutModalOpen,
    setIsLayoutModalOpen,
    isSpotlightOpen,
    setIsSpotlightOpen,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    projects,
    secrets,
    artifacts,
    healthEndpoints,
    quickActions,
    handleSaveSlot,
    handleLoadSlot
  } = useDashboard();

  const { isVaultUnlocked, unlockVault } = useVault();
  const { addLog } = useTools();

  return (
    <div className="app-root">
      {/* Top Navigation & Status */}
      <Header />

      {/* Main Dynamic Workspace */}
      <ModuleGrid />

      {/* Floating HUD Bubble */}
      <FloatingTools />

      {/* Bottom Status Bar */}
      <Footer />

      {/* Modals & Overlays */}
      <LayoutProfilesModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        layoutStyle={layoutStyle}
        setLayoutStyle={setLayoutStyle}
        colsMode={colsMode}
        setColsMode={setColsMode}
        density={density}
        setDensity={setDensity}
        theme={theme}
        setTheme={setTheme}
        onApplyPreset={(name, ids) => {
          setActiveModuleIds(ids);
          addLog('PRESET', `Applied layout preset: ${name}`, 'info');
        }}
        onSaveSlot={handleSaveSlot}
        onLoadSlot={handleLoadSlot}
      />

      <ModulePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        activeModuleIds={activeModuleIds}
        onToggleModule={(id) => {
          if (activeModuleIds.includes(id)) {
            setActiveModuleIds(p => p.filter(m => m !== id));
          } else {
            setActiveModuleIds(p => [...p, id]);
          }
        }}
        onApplyPreset={(presetIds) => setActiveModuleIds(presetIds)}
      />

      <SpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        projects={projects}
        secrets={secrets}
        artifacts={artifacts}
        healthEndpoints={healthEndpoints}
        quickActions={quickActions}
        isVaultUnlocked={isVaultUnlocked}
        onNavigate={() => {}}
        onExecuteAction={(act) => {
          soundFx.playDeploySuccess();
          addLog(act.category.toUpperCase(), `Executed: ${act.title}`, 'success');
        }}
      />

      <MasterPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onUnlock={(pass) => {
          const res = unlockVault(pass);
          if (res.success) {
            addLog('VAULT', 'Zero-Knowledge Vault unlocked successfully', 'success');
          } else if (res.error === 'BANNED') {
            addLog('SECURITY', 'Security Lockout: 15-minute ban triggered (2 failed attempts)', 'critical');
          } else {
            addLog('VAULT', 'Invalid passphrase attempt (1 attempt remaining before lockout)', 'warn');
          }
          return res;
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DashboardProvider>
      <VaultProvider>
        <ToolsProvider>
          <DashboardContent />
        </ToolsProvider>
      </VaultProvider>
    </DashboardProvider>
  );
};

export default App;
