import React, { useState, useEffect, useCallback } from 'react';
import {
  pingHealthEndpoints,
  pingCustomUrls,
  checkApiAvailability,
  statusColor,
  type PingResult,
} from '../../services/monitorApi';
import { soundFx } from '../../services/soundFx';
import { useTools } from '../../context/ToolsContext';

const POLL_INTERVAL = 30_000;

export const HealthExpandedWorkbench: React.FC = () => {
  const { setInspectorLog } = useTools();

  const [results, setResults] = useState<PingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [lastTs, setLastTs] = useState('');
  const [selected, setSelected] = useState<PingResult | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  // Custom ping state
  const [customUrl, setCustomUrl] = useState('');
  const [customResult, setCustomResult] = useState<PingResult | null>(null);

  const fetchData = useCallback(async () => {
    const available = await checkApiAvailability();
    setApiOnline(available);
    if (!available) { setLoading(false); return; }
    try {
      const data = await pingHealthEndpoints();
      setResults(data.endpoints);
      setLastTs(new Date(data.ts).toLocaleTimeString('ru-RU'));
      if (!selected && data.endpoints.length > 0) {
        setSelected(data.endpoints[0]);
      }
    } catch {
      // keep last state
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleCustomPing = async () => {
    if (!customUrl.trim()) return;
    const url = customUrl.trim().startsWith('http') ? customUrl.trim() : `https://${customUrl.trim()}`;
    setPingLoading(true);
    try {
      const data = await pingCustomUrls([url]);
      const result = data.endpoints[0];
      setCustomResult(result);
      setSelected(result);
      setInspectorLog(
        `SYNTHETIC PROBE [${url}]\n` +
        `Status: ${result.status.toUpperCase()} (HTTP ${result.httpCode})\n` +
        `Latency: ${result.latencyMs}ms\n` +
        `Checked At: ${result.checkedAt}\n` +
        (result.error ? `Error: ${result.error}` : '')
      );
      soundFx.playDeploySuccess();
    } catch (e: any) {
      setInspectorLog(`PING FAILED: ${e.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const statusDotClass = (s: string) => {
    if (s === 'operational') return '';
    if (s === 'degraded' || s === 'timeout') return 'yellow';
    return 'red';
  };

  const cur = selected || results[0] || null;
  const operational = results.filter(r => r.status === 'operational').length;

  return (
    <div className="workbench-split">
      {/* Left — endpoints list */}
      <div className="workbench-left">
        <div className="workbench-bar">
          <span>HEALTH ENDPOINTS ({results.length})</span>
          {loading
            ? <span className="pill yellow">PROBING…</span>
            : apiOnline
              ? <span className="pill green">✓ {operational}/{results.length} UP</span>
              : <span className="pill red">API OFFLINE</span>
          }
        </div>

        {apiOnline === false && (
          <div style={{ padding: '8px', color: 'var(--yellow)', fontSize: '10px' }}>
            ⚠ Monitoring API not reachable.<br />
            Deploy the <code>000_api</code> container to enable live health checks.
          </div>
        )}

        <div className="workbench-list">
          {results.map(ep => (
            <div
              key={ep.id}
              className={`wb-item-row ${cur?.id === ep.id ? 'selected' : ''}`}
              onClick={() => { soundFx.playClick(800); setSelected(ep); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px', whiteSpace: 'nowrap' }}>
                  {ep.name}
                </span>
                <span style={{ color: statusColor(ep.status), fontSize: '9.5px', fontWeight: 'bold' }}>
                  {ep.latencyMs > 0 ? `${ep.latencyMs}ms` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span className={`dot ${statusDotClass(ep.status)}`} style={{ width: '6px', height: '6px' }}></span>
                <span style={{ fontSize: '9px', color: 'var(--fg-dim)' }}>
                  {ep.status} {ep.httpCode > 0 ? `· HTTP ${ep.httpCode}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border)', fontSize: '9px', color: 'var(--fg-muted)' }}>
          Auto-refresh every 30s · Last: {lastTs || '—'}
        </div>

        {/* Manual refresh */}
        <button
          className="btn-accent"
          style={{ margin: '0 8px 8px' }}
          onClick={() => { soundFx.playClick(900); fetchData(); }}
        >
          ↻ Refresh Now
        </button>
      </div>

      {/* Right — telemetry */}
      <div className="workbench-right">
        <div className="workbench-bar">
          <span>TELEMETRY LAB {cur ? `— ${cur.name}` : ''}</span>
        </div>

        <div className="workbench-detail-body">
          {/* Custom ping form */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
            <input
              className="tui-input"
              style={{ flex: 1, height: '24px' }}
              placeholder="https://your-service.example.com"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomPing()}
            />
            <button
              className="btn-accent"
              onClick={handleCustomPing}
              disabled={pingLoading || !customUrl.trim()}
              style={{ height: '24px', whiteSpace: 'nowrap' }}
            >
              {pingLoading ? '⏳' : '⚡ Ping'}
            </button>
          </div>

          {/* Metrics grid */}
          {cur && (
            <>
              <div className="exp-metric-grid">
                <div className="exp-metric-box">
                  <div className="exp-metric-label">STATUS</div>
                  <div className="exp-metric-val" style={{ color: statusColor(cur.status), fontSize: '14px' }}>
                    {cur.status.toUpperCase()}
                  </div>
                </div>
                <div className="exp-metric-box">
                  <div className="exp-metric-label">HTTP CODE</div>
                  <div className="exp-metric-val" style={{ color: cur.httpCode >= 200 && cur.httpCode < 400 ? 'var(--green)' : 'var(--red)' }}>
                    {cur.httpCode || '—'}
                  </div>
                </div>
                <div className="exp-metric-box">
                  <div className="exp-metric-label">LATENCY</div>
                  <div className="exp-metric-val" style={{ color: cur.latencyMs > 500 ? 'var(--yellow)' : 'var(--cyan)' }}>
                    {cur.latencyMs > 0 ? `${cur.latencyMs} ms` : '—'}
                  </div>
                </div>
                <div className="exp-metric-box">
                  <div className="exp-metric-label">CHECKED</div>
                  <div className="exp-metric-val" style={{ fontSize: '10px' }}>
                    {cur.checkedAt ? new Date(cur.checkedAt).toLocaleTimeString('ru-RU') : '—'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '9.5px', color: 'var(--fg-dim)' }}>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ color: 'var(--fg-muted)' }}>URL: </span>
                  <span style={{ color: 'var(--cyan)' }}>{cur.url}</span>
                </div>
                {cur.error && (
                  <div style={{ color: 'var(--red)', marginTop: '4px' }}>
                    ERROR: {cur.error}
                  </div>
                )}
              </div>

              {/* Sparkline placeholder — will be real when history is stored */}
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginBottom: '4px' }}>LATENCY TREND (live)</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '16px', letterSpacing: '2px' }}>
                  ▂▃▅▄▆▃▅▇▆▅
                </div>
              </div>

              {/* All endpoints summary table */}
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginBottom: '6px' }}>ALL ENDPOINTS</div>
                <table className="tui-table" style={{ fontSize: '9.5px' }}>
                  <thead>
                    <tr><th>NAME</th><th>STATUS</th><th>RTT</th><th>CODE</th></tr>
                  </thead>
                  <tbody>
                    {results.map(ep => (
                      <tr
                        key={ep.id}
                        style={{ cursor: 'pointer', opacity: cur?.id === ep.id ? 1 : 0.7 }}
                        onClick={() => setSelected(ep)}
                      >
                        <td style={{ color: '#fff' }}>{ep.name}</td>
                        <td>
                          <span className={`dot ${statusDotClass(ep.status)}`} style={{ width: '5px', height: '5px' }}></span>
                          {ep.status}
                        </td>
                        <td style={{ color: statusColor(ep.status) }}>
                          {ep.latencyMs > 0 ? `${ep.latencyMs}ms` : '—'}
                        </td>
                        <td style={{ color: ep.httpCode >= 200 && ep.httpCode < 400 ? 'var(--green)' : 'var(--red)' }}>
                          {ep.httpCode || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
