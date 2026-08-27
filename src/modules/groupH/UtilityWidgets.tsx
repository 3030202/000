import React, { useState, useCallback } from 'react';
import { soundFx } from '../../services/soundFx';

// ─── H5: JSON Formatter & Inspector ──────────────────────────────────────────
export const JsonFormatterWidget: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'format' | 'minify' | 'inspect'>('format');

  const process = useCallback(() => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      if (mode === 'format') {
        setOutput(JSON.stringify(parsed, null, 2));
      } else if (mode === 'minify') {
        setOutput(JSON.stringify(parsed));
      } else {
        // inspect: show type tree
        const inspect = (obj: any, depth = 0): string => {
          const indent = '  '.repeat(depth);
          if (obj === null) return `${indent}null`;
          if (Array.isArray(obj)) return `${indent}Array[${obj.length}]\n${obj.map((v, i) => `${indent}  [${i}]: ${typeof v === 'object' ? '\n' + inspect(v, depth + 2) : JSON.stringify(v)}`).join('\n')}`;
          if (typeof obj === 'object') return Object.entries(obj).map(([k, v]) => `${indent}"${k}": ${typeof v === 'object' && v !== null ? '\n' + inspect(v, depth + 1) : `${typeof v} = ${JSON.stringify(v)}`}`).join('\n');
          return `${indent}${typeof obj} = ${JSON.stringify(obj)}`;
        };
        setOutput(inspect(parsed));
      }
      soundFx.playClick(1100);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
      soundFx.playClick(300);
    }
  }, [input, mode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {(['format', 'minify', 'inspect'] as const).map(m => (
          <button key={m} className={`btn-accent ${mode === m ? '' : 'dim'}`} style={{ fontSize: '9px', padding: '1px 6px', opacity: mode === m ? 1 : 0.5 }} onClick={() => setMode(m)}>
            {m === 'format' ? '⚡ Format' : m === 'minify' ? '📦 Minify' : '🔍 Inspect'}
          </button>
        ))}
        <button className="btn-accent" style={{ fontSize: '9px', padding: '1px 6px', marginLeft: 'auto' }} onClick={process}>▶ Run</button>
      </div>
      <textarea
        className="tui-input"
        style={{ flex: 1, minHeight: '40px', fontFamily: 'monospace', fontSize: '9.5px', resize: 'none' }}
        placeholder='Paste JSON here…'
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) process(); }}
      />
      {error && <div style={{ color: 'var(--red)', fontSize: '9px', padding: '2px 4px', background: '#1a0000', border: '1px solid var(--red)', borderRadius: '2px' }}>❌ {error}</div>}
      {output && (
        <pre style={{ flex: 1, margin: 0, padding: '4px', background: '#010204', border: '1px solid var(--border)', overflow: 'auto', fontFamily: 'monospace', fontSize: '9px', color: 'var(--green)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {output}
        </pre>
      )}
    </div>
  );
};

export const JsonFormatterExpandedWorkbench: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'format' | 'minify' | 'inspect'>('format');
  const [stats, setStats] = useState<{ keys: number; depth: number; size: string } | null>(null);

  const getDepth = (obj: any, d = 0): number => {
    if (typeof obj !== 'object' || obj === null) return d;
    return Math.max(...Object.values(obj).map(v => getDepth(v, d + 1)), d);
  };
  const countKeys = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) return 0;
    return Object.keys(obj).reduce((s, k) => s + 1 + countKeys((obj as any)[k]), 0);
  };

  const process = useCallback(() => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setStats({ keys: countKeys(parsed), depth: getDepth(parsed), size: `${new Blob([input]).size} B` });
      if (mode === 'format') setOutput(JSON.stringify(parsed, null, 2));
      else if (mode === 'minify') setOutput(JSON.stringify(parsed));
      else {
        const inspect = (obj: any, depth = 0): string => {
          const indent = '  '.repeat(depth);
          if (obj === null) return `${indent}null`;
          if (Array.isArray(obj)) return `${indent}Array[${obj.length}]\n${obj.map((v, i) => `${indent}  [${i}]: ${typeof v === 'object' ? '\n' + inspect(v, depth + 2) : JSON.stringify(v)}`).join('\n')}`;
          if (typeof obj === 'object') return Object.entries(obj).map(([k, v]) => `${indent}"${k}": ${typeof v === 'object' && v !== null ? '\n' + inspect(v, depth + 1) : `${typeof v} = ${JSON.stringify(v)}`}`).join('\n');
          return `${indent}${typeof obj} = ${JSON.stringify(obj)}`;
        };
        setOutput(inspect(parsed));
      }
      soundFx.playClick(1100);
    } catch (e: any) { setError(e.message); setOutput(''); setStats(null); soundFx.playClick(300); }
  }, [input, mode]);

  const copyOutput = () => { navigator.clipboard.writeText(output); soundFx.playDeploySuccess(); };

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', gap: '4px', display: 'flex', flexDirection: 'column' }}>
        <div className="workbench-bar">
          <span>JSON INPUT</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {(['format', 'minify', 'inspect'] as const).map(m => (
              <button key={m} className="btn-accent" style={{ fontSize: '9px', padding: '1px 6px', opacity: mode === m ? 1 : 0.5 }} onClick={() => setMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="tui-input"
          style={{ flex: 1, fontFamily: 'monospace', fontSize: '9.5px', resize: 'none' }}
          placeholder='Paste or type JSON...'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) process(); }}
        />
        <button className="btn-accent" onClick={process} style={{ alignSelf: 'stretch' }}>▶ Process (Ctrl+Enter)</button>
        {error && <div style={{ color: 'var(--red)', fontSize: '9.5px', padding: '4px', background: '#1a0000', border: '1px solid var(--red)', borderRadius: '2px' }}>❌ {error}</div>}
      </div>
      <div className="workbench-right" style={{ gap: '4px' }}>
        <div className="workbench-bar">
          <span>OUTPUT — {mode.toUpperCase()}</span>
          {output && <button className="btn-accent" style={{ fontSize: '9px' }} onClick={copyOutput}>[📋 Copy]</button>}
        </div>
        {stats && (
          <div className="exp-metric-grid">
            <div className="exp-metric-box"><div className="exp-metric-label">KEYS</div><div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{stats.keys}</div></div>
            <div className="exp-metric-box"><div className="exp-metric-label">DEPTH</div><div className="exp-metric-val" style={{ color: 'var(--green)' }}>{stats.depth}</div></div>
            <div className="exp-metric-box"><div className="exp-metric-label">SIZE</div><div className="exp-metric-val">{stats.size}</div></div>
          </div>
        )}
        <pre style={{ flex: 1, margin: 0, padding: '6px', background: '#010204', border: '1px solid var(--border)', overflow: 'auto', fontFamily: 'monospace', fontSize: '9.5px', color: 'var(--green)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {output || 'Output will appear here…'}
        </pre>
      </div>
    </div>
  );
};

// ─── H6: Base64 Encoder / Decoder ────────────────────────────────────────────
export const Base64Widget: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const process = () => {
    try {
      setOutput(mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input))));
      soundFx.playClick(1100);
    } catch (e: any) {
      setOutput(`❌ Error: ${e.message}`);
      soundFx.playClick(300);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className="btn-accent" style={{ fontSize: '9px', padding: '1px 6px', opacity: mode === 'encode' ? 1 : 0.5 }} onClick={() => setMode('encode')}>Encode →</button>
        <button className="btn-accent" style={{ fontSize: '9px', padding: '1px 6px', opacity: mode === 'decode' ? 1 : 0.5 }} onClick={() => setMode('decode')}>← Decode</button>
        <button className="btn-accent" style={{ fontSize: '9px', padding: '1px 6px', marginLeft: 'auto' }} onClick={process}>▶ Run</button>
      </div>
      <textarea className="tui-input" style={{ flex: 1, minHeight: '30px', fontFamily: 'monospace', fontSize: '9px', resize: 'none' }} placeholder={mode === 'encode' ? 'Text to encode…' : 'Base64 to decode…'} value={input} onChange={e => setInput(e.target.value)} />
      {output && (
        <div style={{ flex: 1, padding: '4px', background: '#010204', border: '1px solid var(--border)', overflow: 'auto', fontFamily: 'monospace', fontSize: '9px', color: output.startsWith('❌') ? 'var(--red)' : 'var(--cyan)', wordBreak: 'break-all', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(output); soundFx.playDeploySuccess(); }}>
          {output}
        </div>
      )}
    </div>
  );
};

export const Base64ExpandedWorkbench: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const process = () => {
    try {
      setOutput(mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input))));
      soundFx.playClick(1100);
    } catch (e: any) { setOutput(`Error: ${e.message}`); soundFx.playClick(300); }
  };

  const swap = () => { setInput(output); setOutput(''); setMode(m => m === 'encode' ? 'decode' : 'encode'); };

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar">
          <span>INPUT ({mode === 'encode' ? 'TEXT' : 'BASE64'})</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-accent" style={{ fontSize: '9px', opacity: mode === 'encode' ? 1 : 0.5 }} onClick={() => setMode('encode')}>Encode</button>
            <button className="btn-accent" style={{ fontSize: '9px', opacity: mode === 'decode' ? 1 : 0.5 }} onClick={() => setMode('decode')}>Decode</button>
          </div>
        </div>
        <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '10px', resize: 'none' }} placeholder={mode === 'encode' ? 'Paste plain text…' : 'Paste Base64 string…'} value={input} onChange={e => setInput(e.target.value)} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-accent" style={{ flex: 1 }} onClick={process}>▶ {mode === 'encode' ? 'Encode' : 'Decode'}</button>
          <button className="btn-accent" style={{ fontSize: '9px' }} onClick={swap}>⇄ Swap</button>
        </div>
      </div>
      <div className="workbench-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar">
          <span>OUTPUT ({mode === 'encode' ? 'BASE64' : 'TEXT'})</span>
          {output && <button className="btn-accent" style={{ fontSize: '9px' }} onClick={() => { navigator.clipboard.writeText(output); soundFx.playDeploySuccess(); }}>[📋 Copy]</button>}
        </div>
        <div className="exp-metric-grid">
          <div className="exp-metric-box"><div className="exp-metric-label">INPUT SIZE</div><div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{new Blob([input]).size} B</div></div>
          <div className="exp-metric-box"><div className="exp-metric-label">OUTPUT SIZE</div><div className="exp-metric-val" style={{ color: 'var(--green)' }}>{new Blob([output]).size} B</div></div>
          <div className="exp-metric-box"><div className="exp-metric-label">RATIO</div><div className="exp-metric-val">{input.length > 0 ? (output.length / input.length).toFixed(2) + 'x' : '—'}</div></div>
        </div>
        <pre style={{ flex: 1, margin: 0, padding: '6px', background: '#010204', border: '1px solid var(--border)', overflow: 'auto', fontFamily: 'monospace', fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {output || 'Result will appear here…'}
        </pre>
      </div>
    </div>
  );
};

// ─── H7: Text Diff Viewer ────────────────────────────────────────────────────
export const TextDiffWidget: React.FC = () => {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diff, setDiff] = useState<{ type: 'same' | 'add' | 'del'; line: string }[]>([]);

  const computeDiff = () => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const result: { type: 'same' | 'add' | 'del'; line: string }[] = [];
    const maxLen = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLen; i++) {
      const a = linesA[i] ?? undefined;
      const b = linesB[i] ?? undefined;
      if (a === b) result.push({ type: 'same', line: a! });
      else {
        if (a !== undefined) result.push({ type: 'del', line: a });
        if (b !== undefined) result.push({ type: 'add', line: b });
      }
    }
    setDiff(result);
    soundFx.playClick(1100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '9px', resize: 'none' }} placeholder="Text A (original)" value={textA} onChange={e => setTextA(e.target.value)} />
        <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '9px', resize: 'none' }} placeholder="Text B (modified)" value={textB} onChange={e => setTextB(e.target.value)} />
      </div>
      <button className="btn-accent" onClick={computeDiff} style={{ fontSize: '9px' }}>⚡ Compare</button>
      {diff.length > 0 && (
        <div style={{ flex: 1, background: '#010204', border: '1px solid var(--border)', overflow: 'auto', padding: '4px', fontFamily: 'monospace', fontSize: '9px' }}>
          {diff.map((d, i) => (
            <div key={i} style={{ color: d.type === 'add' ? 'var(--green)' : d.type === 'del' ? 'var(--red)' : 'var(--fg-dim)', borderLeft: `2px solid ${d.type === 'add' ? 'var(--green)' : d.type === 'del' ? 'var(--red)' : 'transparent'}`, paddingLeft: '4px' }}>
              {d.type === 'add' ? '+ ' : d.type === 'del' ? '- ' : '  '}{d.line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TextDiffExpandedWorkbench: React.FC = () => {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diff, setDiff] = useState<{ type: 'same' | 'add' | 'del'; line: string }[]>([]);

  const computeDiff = () => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const result: { type: 'same' | 'add' | 'del'; line: string }[] = [];
    const maxLen = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLen; i++) {
      const a = linesA[i] ?? undefined;
      const b = linesB[i] ?? undefined;
      if (a === b) result.push({ type: 'same', line: a! });
      else {
        if (a !== undefined) result.push({ type: 'del', line: a });
        if (b !== undefined) result.push({ type: 'add', line: b });
      }
    }
    setDiff(result);
    soundFx.playClick(1100);
  };

  const added = diff.filter(d => d.type === 'add').length;
  const removed = diff.filter(d => d.type === 'del').length;
  const unchanged = diff.filter(d => d.type === 'same').length;

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>TEXT A (Original)</span></div>
        <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '10px', resize: 'none' }} placeholder="Paste original text…" value={textA} onChange={e => setTextA(e.target.value)} />
        <div className="workbench-bar"><span>TEXT B (Modified)</span></div>
        <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '10px', resize: 'none' }} placeholder="Paste modified text…" value={textB} onChange={e => setTextB(e.target.value)} />
        <button className="btn-accent" onClick={computeDiff}>⚡ Compare Diff</button>
      </div>
      <div className="workbench-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>DIFF OUTPUT</span></div>
        {diff.length > 0 && (
          <div className="exp-metric-grid">
            <div className="exp-metric-box"><div className="exp-metric-label">ADDED</div><div className="exp-metric-val" style={{ color: 'var(--green)' }}>+{added}</div></div>
            <div className="exp-metric-box"><div className="exp-metric-label">REMOVED</div><div className="exp-metric-val" style={{ color: 'var(--red)' }}>-{removed}</div></div>
            <div className="exp-metric-box"><div className="exp-metric-label">UNCHANGED</div><div className="exp-metric-val">{unchanged}</div></div>
          </div>
        )}
        <div style={{ flex: 1, background: '#010204', border: '1px solid var(--border)', overflow: 'auto', padding: '6px', fontFamily: 'monospace', fontSize: '10px', lineHeight: '1.5' }}>
          {diff.length > 0 ? diff.map((d, i) => (
            <div key={i} style={{ color: d.type === 'add' ? 'var(--green)' : d.type === 'del' ? 'var(--red)' : 'var(--fg-dim)', background: d.type === 'add' ? '#001800' : d.type === 'del' ? '#180000' : 'transparent', borderLeft: `3px solid ${d.type === 'add' ? 'var(--green)' : d.type === 'del' ? 'var(--red)' : 'transparent'}`, paddingLeft: '6px' }}>
              {d.type === 'add' ? '+ ' : d.type === 'del' ? '- ' : '  '}{d.line}
            </div>
          )) : <div style={{ color: 'var(--fg-dim)', textAlign: 'center', padding: '20px' }}>Paste text in both panels and click Compare</div>}
        </div>
      </div>
    </div>
  );
};

// ─── H10: Markdown Previewer ─────────────────────────────────────────────────
// Simple markdown-to-HTML converter (no dependencies)
function parseMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="color:var(--cyan);margin:6px 0 3px;font-size:12px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:var(--green);margin:8px 0 4px;font-size:13px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:var(--yellow);margin:10px 0 5px;font-size:15px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#0a1628;padding:1px 4px;border-radius:2px;color:var(--cyan)">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px;list-style:decimal">$1</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:8px 0">')
    .replace(/\n/g, '<br>');
}

export const MarkdownPreviewWidget: React.FC = () => {
  const [input, setInput] = useState('# Hello World\n\nType **markdown** here and see *live preview*.\n\n- Item 1\n- Item 2\n\n`code snippet`');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '9px', resize: 'none' }} value={input} onChange={e => setInput(e.target.value)} placeholder="Type Markdown…" />
      <div style={{ flex: 1, padding: '4px', background: '#010204', border: '1px solid var(--border)', overflow: 'auto', fontSize: '10px', color: 'var(--fg)', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: parseMarkdown(input) }} />
    </div>
  );
};

export const MarkdownPreviewExpandedWorkbench: React.FC = () => {
  const [input, setInput] = useState('# Mission Control Notes\n\n## Section 1\n\nThis is a **markdown** editor with *live preview*.\n\n### Features\n- Real-time rendering\n- `inline code` support\n- **Bold** and *italic*\n\n---\n\n1. Ordered list item\n2. Another item\n\n> Note: This is a simple parser.');

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>MARKDOWN SOURCE</span><span style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>{input.length} chars</span></div>
        <textarea className="tui-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '10px', resize: 'none', lineHeight: '1.5' }} value={input} onChange={e => setInput(e.target.value)} placeholder="Type Markdown…" />
      </div>
      <div className="workbench-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>LIVE PREVIEW</span></div>
        <div style={{ flex: 1, padding: '8px', background: '#010204', border: '1px solid var(--border)', overflow: 'auto', fontSize: '10.5px', color: 'var(--fg)', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: parseMarkdown(input) }} />
      </div>
    </div>
  );
};
