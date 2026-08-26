import React from 'react';
import { useTools } from '../../context/ToolsContext';

export const ScratchpadWidget: React.FC = () => {
  const { notepadText, setNotepadText } = useTools();

  return (
    <textarea
      value={notepadText}
      onChange={(e) => setNotepadText(e.target.value)}
      style={{ width: '100%', height: '100%', minHeight: '80px', border: 'none', background: '#000', resize: 'none' }}
    />
  );
};

export const NotepadExpandedWorkbench: React.FC = () => {
  const { notepadText, setNotepadText } = useTools();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', gap: '8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '3px' }}>
          MARKDOWN / RAW SCRATCHPAD EDITOR
        </div>
        <textarea 
          value={notepadText} 
          onChange={e => setNotepadText(e.target.value)}
          style={{ flex: 1, width: '100%', height: '100%', background: '#000', color: '#fff', border: '1px solid var(--border)', resize: 'none', padding: '6px', fontSize: '11px' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#020306', border: '1px solid var(--border)', padding: '6px', borderRadius: '3px' }}>
        <div style={{ fontSize: '9.5px', color: 'var(--fg-muted)', fontWeight: 'bold', marginBottom: '3px' }}>
          FORMATTED PREVIEW
        </div>
        <div style={{ flex: 1, overflowY: 'auto', color: 'var(--fg-dim)', whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.5' }}>
          {notepadText}
        </div>
      </div>
    </div>
  );
};
