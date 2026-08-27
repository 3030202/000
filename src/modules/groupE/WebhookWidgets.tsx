import React, { useState } from 'react';
import { soundFx } from '../../services/soundFx';

interface WebhookHistoryItem {
  id: string;
  url: string;
  method: string;
  status: number;
  timeMs: number;
  responsePreview: string;
  timestamp: string;
}

export const WebhookDispatcherWidget: React.FC = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'POST' | 'GET'>('POST');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setStatus(null);
    const start = Date.now();
    try {
      const res = await fetch(url.trim(), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ event: 'test_webhook', source: '000-mission-control', ts: new Date().toISOString() }) : undefined,
      });
      const timeMs = Date.now() - start;
      setStatus(`${res.status} OK (${timeMs}ms)`);
      soundFx.playDeploySuccess();
    } catch (e: any) {
      const timeMs = Date.now() - start;
      setStatus(`ERR (${timeMs}ms): ${e.message?.slice(0, 20)}`);
      soundFx.playClick(300);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <select
          className="tui-input"
          style={{ width: '55px', height: '22px', fontSize: '9px' }}
          value={method}
          onChange={e => setMethod(e.target.value as any)}
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
        </select>
        <input
          className="tui-input"
          style={{ flex: 1, height: '22px', fontSize: '9.5px' }}
          placeholder="https://api.domain.com/webhook"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="btn-accent" style={{ fontSize: '9px' }} onClick={handleSend} disabled={loading}>
          {loading ? '⏳' : '⚡ Send'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#010204', border: '1px solid var(--border)', padding: '4px', borderRadius: '2px' }}>
        {status ? (
          <span style={{ fontSize: '10px', color: status.startsWith('2') ? 'var(--green)' : 'var(--yellow)', fontFamily: 'monospace' }}>
            {status}
          </span>
        ) : (
          <span style={{ fontSize: '9px', color: 'var(--fg-dim)' }}>
            Enter target webhook URL and dispatch test event
          </span>
        )}
      </div>
    </div>
  );
};

export const WebhookDispatcherExpandedWorkbench: React.FC = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'POST' | 'GET' | 'PUT' | 'DELETE'>('POST');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json",\n  "X-Custom-Auth": "000-key"\n}');
  const [payload, setPayload] = useState('{\n  "event": "manual_trigger",\n  "service": "mission_control",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
  const [history, setHistory] = useState<WebhookHistoryItem[]>([]);
  const [activeResponse, setActiveResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDispatch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    const start = Date.now();
    try {
      let parsedHeaders: Record<string, string> = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {}

      const res = await fetch(url.trim(), {
        method,
        headers: parsedHeaders,
        body: method !== 'GET' ? payload : undefined,
      });
      const timeMs = Date.now() - start;
      const text = await res.text();
      let parsedBody: any = text;
      try {
        parsedBody = JSON.parse(text);
      } catch {}

      const item: WebhookHistoryItem = {
        id: `wh-${Date.now()}`,
        url: url.trim(),
        method,
        status: res.status,
        timeMs,
        responsePreview: text.slice(0, 100),
        timestamp: new Date().toLocaleTimeString('ru-RU'),
      };
      setHistory(prev => [item, ...prev]);
      setActiveResponse({
        status: res.status,
        statusText: res.statusText,
        timeMs,
        headers: Object.fromEntries(res.headers.entries()),
        data: parsedBody,
      });
      soundFx.playDeploySuccess();
    } catch (e: any) {
      const timeMs = Date.now() - start;
      const item: WebhookHistoryItem = {
        id: `wh-${Date.now()}`,
        url: url.trim(),
        method,
        status: 0,
        timeMs,
        responsePreview: `ERROR: ${e.message}`,
        timestamp: new Date().toLocaleTimeString('ru-RU'),
      };
      setHistory(prev => [item, ...prev]);
      setActiveResponse({
        error: e.message,
        timeMs,
      });
      soundFx.playClick(300);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="workbench-bar">
          <span>WEBHOOK BUILDER</span>
          <span className="pill green">{method}</span>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <select
            className="tui-input"
            style={{ width: '70px', height: '24px' }}
            value={method}
            onChange={e => setMethod(e.target.value as any)}
          >
            <option value="POST">POST</option>
            <option value="GET">GET</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            className="tui-input"
            style={{ flex: 1, height: '24px', fontSize: '10px' }}
            placeholder="https://hook.site/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '9px', color: 'var(--cyan)', fontWeight: 'bold' }}>HEADERS (JSON)</div>
        <textarea
          className="tui-input"
          style={{ height: '55px', fontFamily: 'monospace', fontSize: '9px', resize: 'none' }}
          value={headers}
          onChange={e => setHeaders(e.target.value)}
        />

        <div style={{ fontSize: '9px', color: 'var(--cyan)', fontWeight: 'bold' }}>PAYLOAD (JSON)</div>
        <textarea
          className="tui-input"
          style={{ flex: 1, minHeight: '80px', fontFamily: 'monospace', fontSize: '9.5px', resize: 'none' }}
          value={payload}
          onChange={e => setPayload(e.target.value)}
        />

        <button className="btn-accent" onClick={handleDispatch} disabled={loading || !url.trim()}>
          {loading ? '⏳ Dispatching...' : '🚀 Dispatch Webhook'}
        </button>
      </div>

      <div className="workbench-right" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="workbench-bar">
          <span>DISPATCH LOG & INSPECT</span>
          {activeResponse && <span className="pill green">{activeResponse.timeMs}ms</span>}
        </div>

        {activeResponse && (
          <div style={{ padding: '6px', background: '#010204', border: '1px solid var(--border)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
              <span style={{ color: activeResponse.status >= 200 && activeResponse.status < 400 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                STATUS: {activeResponse.status || 'ERR'} {activeResponse.statusText || ''}
              </span>
              <span style={{ color: 'var(--fg-dim)' }}>RTT: {activeResponse.timeMs}ms</span>
            </div>
            <pre style={{ margin: 0, maxHeight: '100px', overflow: 'auto', fontSize: '9px', color: 'var(--green)', fontFamily: 'monospace' }}>
              {typeof activeResponse.data === 'object' ? JSON.stringify(activeResponse.data, null, 2) : activeResponse.data || activeResponse.error}
            </pre>
          </div>
        )}

        <div style={{ fontSize: '9.5px', color: 'var(--fg-muted)', fontWeight: 'bold', marginTop: '4px' }}>
          RECENT DISPATCHES ({history.length})
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="tui-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>METHOD</th>
                <th>URL</th>
                <th>STATUS</th>
                <th>RTT</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ color: 'var(--fg-dim)', fontSize: '9px' }}>{h.timestamp}</td>
                  <td style={{ color: 'var(--cyan)' }}>{h.method}</td>
                  <td style={{ color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</td>
                  <td style={{ color: h.status >= 200 && h.status < 400 ? 'var(--green)' : 'var(--red)' }}>{h.status || 'ERR'}</td>
                  <td>{h.timeMs}ms</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-dim)', padding: '16px' }}>
                    No webhooks dispatched yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
