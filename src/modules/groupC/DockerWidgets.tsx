import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';
import {
  getDockerStatus,
  checkApiAvailability,
  containerStateClass,
  type DockerContainer,
} from '../../services/monitorApi';

const POLL_INTERVAL = 10_000; // 10s for docker

function useDockerData() {
  const [data, setData] = useState<DockerContainer[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [dockerAvailable, setDockerAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastTs, setLastTs] = useState('');

  const fetchData = useCallback(async () => {
    const available = await checkApiAvailability();
    setApiOnline(available);
    if (!available) { setLoading(false); return; }
    try {
      const result = await getDockerStatus();
      setDockerAvailable(result.available);
      setData(result.containers);
      setLastTs(new Date(result.ts).toLocaleTimeString('ru-RU'));
    } catch {
      // keep last state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, apiOnline, dockerAvailable, loading, lastTs, refetch: fetchData };
}

// ─── Compact tile ─────────────────────────────────────────────────────────────
export const DockerContainersWidget: React.FC = () => {
  const { data, apiOnline, dockerAvailable, loading, lastTs, refetch } = useDockerData();

  const MOCK_CONTAINERS = [
    { id: 'c-01', name: '000_app',    state: 'running', image: '000-app', status: 'Up 14 days', ports: '80/tcp' },
    { id: 'c-02', name: '000_caddy',  state: 'running', image: 'caddy:2.8', status: 'Up 14 days', ports: '80/tcp, 443/tcp' },
    { id: 'c-03', name: '000_api',    state: 'running', image: '000-api', status: 'Up 5 min', ports: '4000/tcp' },
  ];

  if (loading) {
    return <div style={{ color: 'var(--fg-dim)', fontSize: '10px', padding: '4px' }}>⏳ Querying Docker…</div>;
  }

  const containers = data.length > 0 ? data : MOCK_CONTAINERS;
  const running = containers.filter(c => c.state?.toLowerCase() === 'running').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <table className="tui-table" style={{ flex: 1 }}>
        <thead>
          <tr><th>CONTAINER</th><th>STATE</th><th>IMAGE</th></tr>
        </thead>
        <tbody>
          {containers.slice(0, 8).map(c => {
            const state = c.state?.toLowerCase() || 'unknown';
            const dotClass = state === 'running' ? '' : state === 'exited' ? 'red' : 'yellow';
            return (
              <tr key={c.id}>
                <td style={{ color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </td>
                <td>
                  <span className={`dot ${dotClass}`}></span>
                  {state}
                </td>
                <td style={{ color: 'var(--fg-dim)', fontSize: '9px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.image}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--fg-muted)', borderTop: '1px solid var(--border)', paddingTop: '2px', marginTop: '2px' }}>
        <span>▶ {running}/{containers.length} RUNNING</span>
        {apiOnline && dockerAvailable
          ? <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => { soundFx.playClick(900); refetch(); }}>↻ {lastTs}</span>
          : apiOnline === false
            ? <span style={{ color: 'var(--yellow)' }}>⚠ API offline</span>
            : dockerAvailable === false
              ? <span style={{ color: 'var(--yellow)' }}>⚠ Docker N/A</span>
              : null
        }
      </div>
    </div>
  );
};

// ─── Expanded Workbench ───────────────────────────────────────────────────────
export const DockerExpandedWorkbench: React.FC = () => {
  const { setInspectorLog } = useTools();
  const { data: liveContainers, apiOnline, dockerAvailable, loading, lastTs, refetch } = useDockerData();
  const logRef = useRef<HTMLDivElement>(null);

  const MOCK: DockerContainer[] = [
    { id: 'c-01', name: '000_app',    image: '000-app:latest',   state: 'running', status: 'Up 14 days', ports: '80/tcp', created: '14 days ago', stats: { name: '000_app', cpu: '0.8%', memUsage: '22.4MB / 8GB', memPct: '0.28%', netIO: '1.2MB / 340KB', blockIO: '14MB / 0B' } },
    { id: 'c-02', name: '000_caddy',  image: 'caddy:2.8-alpine', state: 'running', status: 'Up 14 days', ports: '80/tcp, 443/tcp', created: '14 days ago', stats: { name: '000_caddy', cpu: '1.2%', memUsage: '34.8MB / 8GB', memPct: '0.43%', netIO: '4.8MB / 2.1MB', blockIO: '8MB / 0B' } },
    { id: 'c-03', name: '000_api',    image: '000-api:latest',   state: 'running', status: 'Up 5 min',   ports: '4000/tcp', created: '5 minutes ago', stats: null },
  ];

  const containers = liveContainers.length > 0 ? liveContainers : MOCK;
  const [selectedId, setSelectedId] = useState(containers[0]?.id || '');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const cur = containers.find(c => c.id === selectedId) || containers[0] || null;

  // Auto-select first container
  useEffect(() => {
    if (containers.length > 0 && !containers.find(c => c.id === selectedId)) {
      setSelectedId(containers[0].id);
    }
  }, [containers]);

  // Fetch/simulate logs when selection changes
  useEffect(() => {
    if (!cur) return;
    setLogLines([]);
    setLogLoading(true);
    const lines = [
      `[INFO] ${new Date().toLocaleTimeString('ru-RU')} Container: ${cur.name}`,
      `[INFO] Image: ${cur.image}`,
      `[INFO] Status: ${cur.status || cur.state}`,
      `[INFO] Ports: ${cur.ports || '—'}`,
      `[INFO] Created: ${cur.created || '—'}`,
      ...(cur.stats ? [
        `[STATS] CPU: ${cur.stats.cpu}`,
        `[STATS] Memory: ${cur.stats.memUsage} (${cur.stats.memPct})`,
        `[STATS] Network I/O: ${cur.stats.netIO}`,
        `[STATS] Block I/O: ${cur.stats.blockIO}`,
      ] : ['[STATS] Live stats not available (container may be stopped)']),
      `[LOG] --- Live log stream would appear here ---`,
      `[LOG] Connect 000_api container to Docker socket for real logs`,
    ];
    // Stream lines with delay for effect
    let i = 0;
    const id = setInterval(() => {
      if (i >= lines.length) { clearInterval(id); setLogLoading(false); return; }
      setLogLines(prev => [...prev, lines[i++]]);
    }, 80);
    return () => clearInterval(id);
  }, [selectedId, cur?.id]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const stateColor = (state: string) => {
    const s = state?.toLowerCase();
    if (s === 'running') return 'var(--green)';
    if (s === 'exited') return 'var(--red)';
    return 'var(--yellow)';
  };

  const running = containers.filter(c => c.state?.toLowerCase() === 'running').length;

  return (
    <div className="workbench-split">
      {/* Left — container registry */}
      <div className="workbench-left">
        <div className="workbench-bar">
          <span>CONTAINERS ({containers.length})</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {loading
              ? <span className="pill yellow">QUERYING…</span>
              : apiOnline === false
                ? <span className="pill yellow">API OFFLINE</span>
                : dockerAvailable === false
                  ? <span className="pill yellow">DOCKER N/A</span>
                  : <span className="pill green">▶ {running}/{containers.length} RUNNING</span>
            }
            <button
              className="btn-accent"
              style={{ fontSize: '9px', padding: '1px 6px' }}
              onClick={() => { soundFx.playClick(900); refetch(); }}
            >↻</button>
          </div>
        </div>

        {apiOnline === false && (
          <div style={{ padding: '6px 8px', color: 'var(--yellow)', fontSize: '9.5px', borderBottom: '1px solid var(--border)' }}>
            ⚠ Deploy <code>000_api</code> container for real Docker data
          </div>
        )}

        <div className="workbench-list">
          {containers.map(c => {
            const state = c.state?.toLowerCase() || 'unknown';
            return (
              <div
                key={c.id}
                className={`wb-item-row ${c.id === cur?.id ? 'selected' : ''}`}
                onClick={() => { soundFx.playClick(800); setSelectedId(c.id); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '10.5px' }}>{c.name}</span>
                  <span style={{ fontSize: '9px', color: stateColor(state), fontWeight: 'bold' }}>
                    {state.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--fg-dim)', marginTop: '2px' }}>
                  {c.image}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginTop: '1px' }}>
                  {c.status || c.state} · {c.ports || 'no ports'}
                </div>
                {c.stats && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: 'var(--cyan)', marginTop: '2px' }}>
                    <span>CPU: {c.stats.cpu}</span>
                    <span>MEM: {c.stats.memPct}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '4px 8px', fontSize: '9px', color: 'var(--fg-muted)', borderTop: '1px solid var(--border)' }}>
          Last updated: {lastTs || '—'} · Auto-refresh 10s
        </div>
      </div>

      {/* Right — container detail + log */}
      <div className="workbench-right">
        <div className="workbench-bar">
          <span>INSPECT: {cur?.name || '—'}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-accent"
              onClick={() => {
                if (!cur) return;
                soundFx.playDeploySuccess();
                setInspectorLog(
                  `DOCKER INSPECT: ${cur.name}\n` +
                  `Image: ${cur.image}\n` +
                  `State: ${cur.state}\n` +
                  `Status: ${cur.status}\n` +
                  `Ports: ${cur.ports}\n` +
                  `Created: ${cur.created}\n` +
                  (cur.stats ? `\nLive Stats:\n  CPU: ${cur.stats.cpu}\n  Memory: ${cur.stats.memUsage} (${cur.stats.memPct})\n  Net I/O: ${cur.stats.netIO}\n  Block I/O: ${cur.stats.blockIO}` : '')
                );
              }}
            >
              [Inspect JSON]
            </button>
          </div>
        </div>

        <div className="workbench-detail-body" style={{ gap: '6px' }}>
          {/* Detail metrics */}
          {cur && (
            <div className="exp-metric-grid">
              <div className="exp-metric-box">
                <div className="exp-metric-label">STATE</div>
                <div className="exp-metric-val" style={{ color: stateColor(cur.state), fontSize: '13px' }}>
                  {cur.state?.toUpperCase() || '—'}
                </div>
              </div>
              <div className="exp-metric-box">
                <div className="exp-metric-label">CPU USAGE</div>
                <div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>
                  {cur.stats?.cpu || '—'}
                </div>
              </div>
              <div className="exp-metric-box">
                <div className="exp-metric-label">MEMORY</div>
                <div className="exp-metric-val" style={{ fontSize: '10px', color: 'var(--green)' }}>
                  {cur.stats?.memUsage || '—'}
                </div>
              </div>
              <div className="exp-metric-box">
                <div className="exp-metric-label">UPTIME</div>
                <div className="exp-metric-val" style={{ fontSize: '10px' }}>
                  {cur.status || cur.created || '—'}
                </div>
              </div>
            </div>
          )}

          {/* Detail table */}
          {cur && (
            <table className="tui-table" style={{ fontSize: '9.5px', margin: '0' }}>
              <tbody>
                <tr><td style={{ color: 'var(--fg-muted)', width: '80px' }}>IMAGE</td><td style={{ color: 'var(--cyan)' }}>{cur.image}</td></tr>
                <tr><td style={{ color: 'var(--fg-muted)' }}>PORTS</td><td>{cur.ports || '—'}</td></tr>
                <tr><td style={{ color: 'var(--fg-muted)' }}>NET I/O</td><td style={{ color: 'var(--fg-dim)' }}>{cur.stats?.netIO || '—'}</td></tr>
                <tr><td style={{ color: 'var(--fg-muted)' }}>BLOCK I/O</td><td style={{ color: 'var(--fg-dim)' }}>{cur.stats?.blockIO || '—'}</td></tr>
              </tbody>
            </table>
          )}

          {/* Log console */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
            <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
              <span>CONTAINER LOG STREAM</span>
              {logLoading && <span style={{ color: 'var(--yellow)' }}>⏳ streaming…</span>}
            </div>
            <div
              ref={logRef}
              style={{
                flex: 1,
                background: '#010204',
                border: '1px solid var(--border)',
                padding: '6px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '9px',
                lineHeight: '1.6',
              }}
            >
              {logLines.map((line, i) => {
                const color = line.startsWith('[WARN]') || line.startsWith('[ERROR]')
                  ? 'var(--red)'
                  : line.startsWith('[STATS]')
                    ? 'var(--cyan)'
                    : line.startsWith('[HEALTHCHECK]')
                      ? 'var(--green)'
                      : 'var(--fg)';
                return <div key={i} style={{ color }}>{line}</div>;
              })}
              {logLines.length === 0 && (
                <div style={{ color: 'var(--fg-dim)' }}>Select a container to view logs…</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
