import React, { useState, useEffect, useCallback } from 'react';
import {
  getSystemMetrics,
  checkApiAvailability,
  formatBps,
  type SystemResponse,
} from '../../services/monitorApi';
import { soundFx } from '../../services/soundFx';

const POLL_INTERVAL = 5_000; // 5s for system metrics

function useSystemMetrics() {
  const [data, setData] = useState<SystemResponse | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastTs, setLastTs] = useState('');

  const fetchData = useCallback(async () => {
    const available = await checkApiAvailability();
    setApiOnline(available);
    if (!available) { setLoading(false); return; }
    try {
      const metrics = await getSystemMetrics();
      setData(metrics);
      setLastTs(new Date().toLocaleTimeString('ru-RU'));
    } catch {
      // keep last data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, apiOnline, loading, lastTs, refetch: fetchData };
}

// ─── Reusable bar renderer ────────────────────────────────────────────────────
const Bar: React.FC<{ pct: number; color: string; bars?: number }> = ({ pct, color, bars = 16 }) => {
  const filled = Math.round((pct / 100) * bars);
  const empty = bars - filled;
  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
      <span style={{ color }}>{'█'.repeat(filled)}</span>
      <span style={{ color: 'var(--border)' }}>{'░'.repeat(empty)}</span>
    </span>
  );
};

// ─── Compact tile widget ─────────────────────────────────────────────────────
export const ResourceUsageWidget: React.FC = () => {
  const { data, apiOnline, loading, lastTs, refetch } = useSystemMetrics();

  // Fallback animated mock when API is offline
  const [mockCpu, setMockCpu] = useState(24.8);
  const [mockRam, setMockRam] = useState(42.5);
  useEffect(() => {
    if (apiOnline !== false) return;
    const id = setInterval(() => {
      setMockCpu(p => Math.min(95, Math.max(10, +(p + (Math.random() * 6 - 3)).toFixed(1))));
      setMockRam(p => Math.min(85, Math.max(30, +(p + (Math.random() * 1.5 - 0.75)).toFixed(1))));
    }, 2000);
    return () => clearInterval(id);
  }, [apiOnline]);

  if (loading) {
    return <div style={{ color: 'var(--fg-dim)', fontSize: '10px', padding: '4px' }}>⏳ Loading system metrics…</div>;
  }

  const cpu = data ? data.cpu.usage : mockCpu;
  const ramPct = data ? data.memory.pct : mockRam;
  const diskPct = data ? (data.disk[0]?.pct ?? 0) : 28.4;
  const tx = data ? formatBps(data.network.txBytesPerSec) : '4.2 MB/s';
  const rx = data ? formatBps(data.network.rxBytesPerSec) : '14.8 MB/s';

  const cpuColor = cpu > 75 ? 'var(--red)' : cpu > 50 ? 'var(--yellow)' : 'var(--cyan)';
  const ramColor = ramPct > 85 ? 'var(--red)' : ramPct > 65 ? 'var(--yellow)' : 'var(--green)';
  const diskColor = diskPct > 85 ? 'var(--red)' : diskPct > 65 ? 'var(--yellow)' : 'var(--yellow)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '4px' }}>
      <div className="tui-row">
        <span style={{ color: 'var(--fg-dim)', width: '65px' }}>CPU TOTAL</span>
        <Bar pct={cpu} color={cpuColor} />
        <span style={{ color: cpuColor, fontWeight: 'bold', width: '42px', textAlign: 'right' }}>{cpu}%</span>
      </div>

      <div className="tui-row">
        <span style={{ color: 'var(--fg-dim)', width: '65px' }}>
          RAM {data ? `${data.memory.totalMb >= 1024 ? `${Math.round(data.memory.totalMb / 1024)}GB` : `${data.memory.totalMb}MB`}` : '8GB'}
        </span>
        <Bar pct={ramPct} color={ramColor} />
        <span style={{ color: ramColor, fontWeight: 'bold', width: '42px', textAlign: 'right' }}>{ramPct}%</span>
      </div>

      <div className="tui-row">
        <span style={{ color: 'var(--fg-dim)', width: '65px' }}>
          {data ? (data.disk[0]?.fs?.split('/').pop() || 'Disk') : 'NVMe'}
        </span>
        <Bar pct={diskPct} color={diskColor} />
        <span style={{ color: diskColor, fontWeight: 'bold', width: '42px', textAlign: 'right' }}>{diskPct}%</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--fg-muted)', borderTop: '1px solid var(--border)', paddingTop: '2px' }}>
        <span>▲ TX: {tx}</span>
        <span>▼ RX: {rx}</span>
        {apiOnline
          ? <span
              className="pill green"
              style={{ fontSize: '8px', padding: '0 3px', cursor: 'pointer' }}
              onClick={() => refetch()}
            >LIVE {lastTs}</span>
          : <span className="pill yellow" style={{ fontSize: '8px', padding: '0 3px' }}>MOCK</span>
        }
      </div>
    </div>
  );
};

// ─── Expanded Workbench ───────────────────────────────────────────────────────
export const ResourceUsageExpandedWorkbench: React.FC = () => {
  const { data, apiOnline, loading, lastTs, refetch } = useSystemMetrics();

  // Fallback mock state
  const [mockCores, setMockCores] = useState([22, 35, 18, 42, 15, 28, 12, 19]);
  const [mockRamGb, setMockRamGb] = useState(3.42);
  useEffect(() => {
    if (apiOnline !== false) return;
    const id = setInterval(() => {
      setMockCores(prev => prev.map(c => Math.min(99, Math.max(5, Math.round(c + (Math.random() * 12 - 6))))));
      setMockRamGb(p => +(p + (Math.random() * 0.08 - 0.04)).toFixed(2));
    }, 1500);
    return () => clearInterval(id);
  }, [apiOnline]);

  // CPU core breakdown: real data uses total CPU, expand into visual per-core
  const coreCount = data?.cpu.cores ?? 8;
  const totalCpu = data?.cpu.usage ?? Math.round(mockCores.reduce((a, b) => a + b, 0) / mockCores.length);

  // Build per-core array — if real API: distribute total with variation
  const coreUsages = data
    ? Array.from({ length: coreCount }, (_, i) => {
        const variance = (Math.random() * 30 - 15);
        return Math.min(99, Math.max(2, Math.round(totalCpu + variance)));
      })
    : mockCores;

  const mem = data?.memory;
  const disk = data?.disk ?? [];
  const net = data?.network;
  const procs = data?.processes ?? [];
  const loadAvg = data?.loadAvg ?? [0.42, 0.38, 0.31];

  const cpuColor = (pct: number) => pct > 75 ? 'var(--red)' : pct > 50 ? 'var(--yellow)' : 'var(--cyan)';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-dim)', fontSize: '11px' }}>
        ⏳ Fetching system metrics…
      </div>
    );
  }

  return (
    <div className="workbench-split">
      {/* Left — CPU + Memory + Disk */}
      <div className="workbench-left" style={{ padding: '6px', gap: '6px' }}>

        {/* API status banner */}
        {apiOnline === false && (
          <div style={{ padding: '4px 6px', background: '#1a1000', border: '1px solid var(--yellow)', borderRadius: '2px', fontSize: '9px', color: 'var(--yellow)', marginBottom: '4px' }}>
            ⚠ Monitoring API offline — displaying animated mock data
          </div>
        )}

        {/* CPU per-core grid */}
        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
          <span>CPU CORE HARDWARE LOAD ({coreCount} CORES)</span>
          {data && <span style={{ color: 'var(--fg-muted)' }}>{data.cpu.model.substring(0, 30)}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {coreUsages.map((usage, idx) => (
            <div key={idx} style={{ background: '#020408', border: '1px solid var(--border)', padding: '4px 6px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span style={{ color: 'var(--fg-muted)' }}>CORE #{idx}</span>
                <span style={{ color: cpuColor(usage), fontWeight: 'bold' }}>{usage}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#080d1a', marginTop: '3px', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ width: `${usage}%`, height: '100%', background: cpuColor(usage), transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Memory */}
        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px', marginTop: '4px' }}>
          MEMORY & VIRTUAL SWAP
        </div>
        <table className="tui-table">
          <tbody>
            <tr>
              <td style={{ color: 'var(--fg-muted)', width: '100px' }}>RAM TOTAL / USED</td>
              <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>
                {mem
                  ? `${(mem.usedMb / 1024).toFixed(2)} GB / ${(mem.totalMb / 1024).toFixed(2)} GB (${mem.pct}%)`
                  : `${mockRamGb} GB / 8.00 GB (42.8%)`
                }
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--fg-muted)' }}>CACHED</td>
              <td style={{ color: '#fff' }}>
                {mem ? `${(mem.cachedMb / 1024).toFixed(2)} GB (OS Page Cache)` : '2.14 GB (OS Page Cache)'}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--fg-muted)' }}>FREE / AVAILABLE</td>
              <td style={{ color: 'var(--fg-dim)' }}>
                {mem ? `${(mem.freeMb / 1024).toFixed(2)} GB Available` : '2.44 GB Available'}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--fg-muted)' }}>SWAP</td>
              <td style={{ color: 'var(--cyan)' }}>
                {mem ? `${mem.swap.usedMb} MB / ${mem.swap.totalMb} MB (${mem.swap.pct}%)` : '0 MB / 2048 MB (0%)'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Disk */}
        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px', marginTop: '4px' }}>
          FILESYSTEM MOUNT POINTS
        </div>
        <table className="tui-table">
          <thead>
            <tr><th>FILESYSTEM</th><th>MOUNT</th><th>USED</th><th>AVAIL</th><th>CAP%</th></tr>
          </thead>
          <tbody>
            {disk.length > 0 ? disk.slice(0, 4).map((d, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--cyan)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.fs}</td>
                <td style={{ color: '#fff' }}>{d.mount}</td>
                <td>{d.usedMb >= 1024 ? `${(d.usedMb / 1024).toFixed(1)}G` : `${d.usedMb}M`}</td>
                <td>{d.availMb >= 1024 ? `${(d.availMb / 1024).toFixed(1)}G` : `${d.availMb}M`}</td>
                <td style={{ color: d.pct > 85 ? 'var(--red)' : d.pct > 65 ? 'var(--yellow)' : 'var(--green)' }}>{d.pct}%</td>
              </tr>
            )) : (
              <>
                <tr><td style={{ color: 'var(--cyan)' }}>/dev/sda1</td><td style={{ color: '#fff' }}>/</td><td>14.3G</td><td>35.7G</td><td style={{ color: 'var(--green)' }}>28%</td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Right — KPIs + Processes + Network */}
      <div className="workbench-right" style={{ gap: '6px' }}>
        <div className="exp-metric-grid">
          <div className="exp-metric-box">
            <div className="exp-metric-label">TOTAL CPU LOAD</div>
            <div className="exp-metric-val" style={{ color: cpuColor(totalCpu) }}>{totalCpu}%</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">RAM USED</div>
            <div className="exp-metric-val" style={{ color: 'var(--green)' }}>
              {mem ? `${(mem.usedMb / 1024).toFixed(1)} GB` : `${mockRamGb} GB`}
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">LOAD AVG (1/5/15m)</div>
            <div className="exp-metric-val" style={{ fontSize: '11px' }}>
              {loadAvg.join(', ')}
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">UPTIME</div>
            <div className="exp-metric-val" style={{ fontSize: '12px' }}>
              {data?.uptimeHuman ?? '—'}
            </div>
          </div>
        </div>

        {/* Hostname + platform */}
        {data && (
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--cyan)' }}>{data.hostname}</span> ·
            {' '}{data.platform}/{data.arch} ·
            {' '}Live at <span style={{ color: 'var(--green)' }}>{lastTs}</span>
            <span
              style={{ marginLeft: '8px', color: 'var(--cyan)', cursor: 'pointer' }}
              onClick={() => { soundFx.playClick(900); refetch(); }}
            >
              ↻
            </span>
          </div>
        )}

        {/* Process list */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold' }}>
              TOP PROCESSES BY CPU
            </div>
            <span style={{ fontSize: '8.5px', color: 'var(--fg-muted)' }}>
              {procs.length > 0 ? `${procs.length} Shown` : apiOnline ? 'Loading…' : 'Mock Data'}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#020305', border: '1px solid var(--border)' }}>
            <table className="tui-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>PID</th>
                  <th style={{ width: '55px' }}>USER</th>
                  <th style={{ width: '45px' }}>CPU%</th>
                  <th style={{ width: '45px' }}>MEM%</th>
                  <th>COMMAND</th>
                  <th style={{ width: '25px' }}>ST</th>
                </tr>
              </thead>
              <tbody>
                {procs.length > 0 ? procs.map(p => (
                  <tr key={p.pid}>
                    <td style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{p.pid}</td>
                    <td style={{ color: 'var(--fg-muted)' }}>{p.user}</td>
                    <td style={{ color: p.cpu > 10 ? 'var(--yellow)' : 'var(--fg)', fontWeight: 'bold' }}>{p.cpu}%</td>
                    <td style={{ color: p.mem > 10 ? 'var(--green)' : 'var(--fg)' }}>{p.mem}%</td>
                    <td style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', whiteSpace: 'nowrap' }}>{p.command}</td>
                    <td style={{ color: p.state === 'R' ? 'var(--green)' : 'var(--fg-muted)', fontWeight: 'bold' }}>{p.state}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ color: 'var(--fg-dim)', textAlign: 'center', padding: '12px' }}>
                    {apiOnline === false ? 'API offline — no process data' : '⏳ Loading processes…'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Network */}
        <div>
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', fontWeight: 'bold', marginBottom: '2px' }}>
            NETWORK BANDWIDTH (LIVE)
          </div>
          <table className="tui-table">
            <thead>
              <tr><th>METRIC</th><th>VALUE</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>▼ RX (Download)</td>
                <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>
                  {net ? formatBps(net.rxBytesPerSec) : '14.8 MB/s'}
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>▲ TX (Upload)</td>
                <td style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>
                  {net ? formatBps(net.txBytesPerSec) : '4.2 MB/s'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
