import React, { useState, useEffect, useCallback } from 'react';
import {
  pingHealthEndpoints,
  pingCustomUrls,
  checkApiAvailability,
  statusColor,
  type PingResult,
} from '../../services/monitorApi';
import { soundFx } from '../../services/soundFx';

const POLL_INTERVAL = 30_000; // 30 seconds

function useLivePing() {
  const [results, setResults] = useState<PingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [lastTs, setLastTs] = useState('');

  const fetchData = useCallback(async () => {
    const available = await checkApiAvailability();
    setApiOnline(available);
    if (!available) { setLoading(false); return; }
    try {
      const data = await pingHealthEndpoints();
      setResults(data.endpoints);
      setLastTs(new Date(data.ts).toLocaleTimeString('ru-RU'));
    } catch {
      // silently keep last state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  return { results, loading, apiOnline, lastTs, refetch: fetchData };
}

// ─── Compact tile widget ─────────────────────────────────────────────────────
export const HealthMatrixWidget: React.FC = () => {
  const { results, loading, apiOnline, lastTs, refetch } = useLivePing();

  if (loading) {
    return (
      <div style={{ color: 'var(--fg-dim)', fontSize: '10px', padding: '4px' }}>
        ⏳ Probing endpoints…
      </div>
    );
  }

  if (apiOnline === false) {
    return (
      <div style={{ fontSize: '10px' }}>
        <div style={{ color: 'var(--yellow)', marginBottom: '4px' }}>
          ⚠ Monitoring API offline — showing static data
        </div>
        <table className="tui-table">
          <thead>
            <tr><th>SERVICE</th><th>STATUS</th><th>RTT</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: '#fff' }}>000 Dashboard</td>
              <td><span className="dot"></span>unknown</td>
              <td style={{ color: 'var(--fg-dim)' }}>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const operational = results.filter(r => r.status === 'operational').length;
  const total = results.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <table className="tui-table" style={{ flex: 1 }}>
        <thead>
          <tr>
            <th>SERVICE</th>
            <th>STATUS</th>
            <th>RTT</th>
            <th>SPARK</th>
          </tr>
        </thead>
        <tbody>
          {results.map(ep => (
            <tr key={ep.id}>
              <td style={{ color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ep.name}
              </td>
              <td>
                <span className={`dot ${ep.status === 'operational' ? '' : ep.status === 'degraded' ? 'yellow' : 'red'}`}></span>
                {ep.status}
              </td>
              <td style={{ color: ep.latencyMs > 500 ? 'var(--yellow)' : 'var(--green)' }}>
                {ep.latencyMs > 0 ? `${ep.latencyMs}ms` : '—'}
              </td>
              <td className="spark">▂▃▅▆▇</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--fg-muted)', borderTop: '1px solid var(--border)', paddingTop: '2px', marginTop: '2px' }}>
        <span>✓ {operational}/{total} UP</span>
        <span
          style={{ color: 'var(--cyan)', cursor: 'pointer' }}
          onClick={() => { soundFx.playClick(900); refetch(); }}
        >
          ↻ {lastTs}
        </span>
      </div>
    </div>
  );
};
