import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ALL_MODULES } from '../../services/moduleCatalog';
import { renderModuleContent } from '../../modules/registry';

export const ModuleGrid: React.FC = () => {
  const { 
    layoutStyle, 
    colsMode, 
    activeModuleIds, 
    setActiveModuleIds, 
    zoomedModuleId, 
    setZoomedModuleId, 
    toggleZoom, 
    setIsPickerOpen 
  } = useDashboard();

  return (
    <main className={`workspace-grid layout-${layoutStyle} cols-${colsMode}`}>
      {activeModuleIds.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: 'var(--yellow)' }}>[!] NO ACTIVE TILES IN VIEWPORT</div>
          <button className="btn-accent" onClick={() => setIsPickerOpen(true)}>
            [OPEN 70-MODULE REGISTRY (F8)]
          </button>
        </div>
      ) : (
        activeModuleIds.map((modId, idx) => {
          const def = ALL_MODULES.find(m => m.id === modId);
          if (!def) return null;
          const isZoomed = zoomedModuleId === modId;

          return (
            <div 
              key={modId} 
              className={`pane-tile ${isZoomed ? 'zoomed' : ''}`}
            >
              {/* Pane Header */}
              <div className="pane-header">
                <div className="pane-title" onDoubleClick={() => toggleZoom(modId)} style={{ cursor: 'pointer' }}>
                  <span style={{ color: 'var(--green)' }}>[{def.code}]</span>
                  <span>{def.name.toUpperCase()}</span>
                  {isZoomed && <span className="pill cyan">[EXPANDED WORKBENCH • ESC TO RESTORE]</span>}
                </div>

                <div className="pane-controls">
                  {/* Zoom / Maximize Toggle */}
                  <button 
                    onClick={() => toggleZoom(modId)} 
                    style={{ color: isZoomed ? 'var(--yellow)' : 'var(--cyan)' }} 
                    title={isZoomed ? 'Restore Size (Esc)' : 'Expand to Fullscreen Workbench'}
                  >
                    {isZoomed ? '🗗' : '🗖 EXPAND'}
                  </button>

                  {/* Move Left / Up */}
                  <button onClick={() => {
                    if (idx > 0) {
                      const copy = [...activeModuleIds];
                      const t = copy[idx]; copy[idx] = copy[idx-1]; copy[idx-1] = t;
                      setActiveModuleIds(copy);
                    }
                  }} title="Move Left/Up">◀</button>

                  {/* Move Right / Down */}
                  <button onClick={() => {
                    if (idx < activeModuleIds.length - 1) {
                      const copy = [...activeModuleIds];
                      const t = copy[idx]; copy[idx] = copy[idx+1]; copy[idx+1] = t;
                      setActiveModuleIds(copy);
                    }
                  }} title="Move Right/Down">▶</button>

                  {/* Close */}
                  <button onClick={() => {
                    if (isZoomed) setZoomedModuleId(null);
                    setActiveModuleIds(p => p.filter(m => m !== modId));
                  }} style={{ color: 'var(--red)' }} title="Close">×</button>
                </div>
              </div>

              {/* Pane Content */}
              <div className="pane-body">
                {renderModuleContent(modId, isZoomed)}
              </div>
            </div>
          );
        })
      )}
    </main>
  );
};
