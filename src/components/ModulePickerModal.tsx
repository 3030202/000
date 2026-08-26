import React, { useState } from 'react';
import { ALL_MODULES, MODULE_GROUPS, ModuleDefinition } from '../services/moduleCatalog';
import { soundFx } from '../services/soundFx';

interface ModulePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModuleIds: string[];
  onToggleModule: (id: string) => void;
  onApplyPreset: (ids: string[]) => void;
}

export const ModulePickerModal: React.FC<ModulePickerModalProps> = ({
  isOpen,
  onClose,
  activeModuleIds,
  onToggleModule,
  onApplyPreset,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  if (!isOpen) return null;

  const q = search.toLowerCase().trim();

  const filteredModules = ALL_MODULES.filter(m => {
    const matchesGroup = selectedGroup === 'ALL' || m.groupId === selectedGroup;
    const matchesSearch = !q || 
      m.code.toLowerCase().includes(q) || 
      m.name.toLowerCase().includes(q) || 
      m.description.toLowerCase().includes(q) ||
      m.group.toLowerCase().includes(q);
    return matchesGroup && matchesSearch;
  });

  const handlePreset = (presetType: 'core' | 'secops' | 'noc' | 'all' | 'none') => {
    soundFx.playClick(900);
    if (presetType === 'core') {
      onApplyPreset(['A1', 'B1', 'D1', 'D2', 'E1', 'F1', 'H1', 'H2']);
    } else if (presetType === 'secops') {
      onApplyPreset(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'F1', 'F2', 'F3', 'F5', 'E1']);
    } else if (presetType === 'noc') {
      onApplyPreset(['D1', 'D2', 'D3', 'D4', 'D5', 'G2', 'G3', 'E1', 'F1', 'H1']);
    } else if (presetType === 'all') {
      onApplyPreset(ALL_MODULES.map(m => m.id));
    } else {
      onApplyPreset([]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '840px', width: '95%' }}>
        <div className="modal-header">
          <span>[+] MODULE CATALOG — SELECT & CONFIGURE ACTIVE MODULES ({activeModuleIds.length}/{ALL_MODULES.length} ACTIVE)</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#888' }}>[ESC / X]</button>
        </div>

        {/* Quick Presets Bar */}
        <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg2)' }}>
          <span style={{ fontSize: '10px', color: 'var(--fg3)' }}>PRESETS:</span>
          <button onClick={() => handlePreset('core')}>[Minimal Core (8)]</button>
          <button onClick={() => handlePreset('noc')}>[NOC Monitor (10)]</button>
          <button onClick={() => handlePreset('secops')}>[SecOps Vault (11)]</button>
          <button onClick={() => handlePreset('all')}>[Enable All (70)]</button>
          <button onClick={() => handlePreset('none')} style={{ color: 'var(--err)' }}>[Clear All (0)]</button>
        </div>

        {/* Filter and Search */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 70 modules by code (A1, B1), name, description..."
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="ALL">All 9 Groups (70)</option>
            {MODULE_GROUPS.map(g => (
              <option key={g.id} value={g.id}>{g.title} ({g.count})</option>
            ))}
          </select>
        </div>

        {/* Module Items List */}
        <div className="modal-body" style={{ maxHeight: '55vh' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>CODE</th>
                <th style={{ width: '60px' }}>STATUS</th>
                <th>MODULE NAME & DESCRIPTION</th>
                <th style={{ width: '90px' }}>WIDGET</th>
                <th style={{ width: '80px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((mod) => {
                const isActive = activeModuleIds.includes(mod.id);
                return (
                  <tr key={mod.id} style={{ background: isActive ? '#0d150d' : undefined }}>
                    <td className="mono" style={{ color: isActive ? 'var(--accent)' : 'var(--fg3)', fontWeight: 'bold' }}>
                      {mod.code}
                    </td>
                    <td>
                      {isActive ? (
                        <span className="pill green">[ON]</span>
                      ) : (
                        <span className="pill">[OFF]</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: isActive ? '#fff' : 'var(--fg)' }}>
                        {mod.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--fg3)' }}>
                        {mod.description}
                      </div>
                    </td>
                    <td>
                      <span className="pill cyan">{mod.widgetType}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          soundFx.playClick(isActive ? 600 : 1000);
                          onToggleModule(mod.id);
                        }}
                        style={{
                          background: isActive ? 'var(--bg3)' : 'var(--accent)',
                          color: isActive ? 'var(--warn)' : '#000',
                          fontWeight: 'bold',
                          borderColor: isActive ? 'var(--warn)' : 'var(--accent)',
                        }}
                      >
                        {isActive ? '[-] Remove' : '[+] Add'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
          <span style={{ fontSize: '10px', color: 'var(--fg3)' }}>
            Active: <strong style={{ color: 'var(--accent)' }}>{activeModuleIds.length}</strong> / {ALL_MODULES.length} modules
          </span>
          <button className="btn-primary" onClick={onClose}>
            [✓ Done & Return to Deck]
          </button>
        </div>
      </div>
    </div>
  );
};
