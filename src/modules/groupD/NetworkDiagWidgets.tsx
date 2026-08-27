import React, { useState, useCallback } from 'react';
import {
  pingCustomUrls,
  checkApiAvailability,
  statusColor,
  type PingResult,
} from '../../services/monitorApi';
import { soundFx } from '../../services/soundFx';

// ─── D4: Instant Ping Tester ─────────────────────────────────────────────────
export const PingTesterWidget: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<PingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doPing = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    const target = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    try {
      const available = await checkApiAvailability();
      if (!available) {
        // Browser-only fallback ping
        const start = Date.now();
        try {
          const resp = await fetch(target, { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
          setResult({
            id: 'ping-1', name: target, url: target,
            status: 'operational', httpCode: 0, latencyMs: Date.now() - start,
            uptime24h: 0, checkedAt: new Date().toISOString(),
          });
        } catch {
          setResult({
            id: 'ping-1', name: target, url: target,
            status: 'down', httpCode: 0, latencyMs: Date.now() - start,
            uptime24h: 0, checkedAt: new Date().toISOString(), error: 'Unreachable (browser CORS limit)',
          });
        }
        soundFx.playClick(1100);
        setLoading(false);
        return;
      }
      const data = await pingCustomUrls([target]);
      setResult(data.endpoints[0] || null);
      soundFx.playClick(1100);
    } catch (e: any) {
      setError(e.message);
      soundFx.playClick(300);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          className="tui-input"
          style={{ flex: 1, height: '22px', fontFamily: 'monospace', fontSize: '9.5px' }}
          placeholder="https://example.com"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doPing()}
        />
        <button className="btn-accent" style={{ fontSize: '9px', padding: '1px 8px' }} onClick={doPing} disabled={loading}>
          {loading ? '⏳' : '⚡ Ping'}
        </button>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: '9px' }}>❌ {error}</div>}

      {result && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: statusColor(result.status), fontWeight: 'bold' }}>
              {result.status.toUpperCase()}
            </span>
            <span style={{ fontSize: '10px', color: result.latencyMs > 500 ? 'var(--yellow)' : 'var(--green)', fontWeight: 'bold' }}>
              {result.latencyMs}ms
            </span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--fg-dim)' }}>
            HTTP {result.httpCode || '—'} · {new Date(result.checkedAt).toLocaleTimeString('ru-RU')}
          </div>
          {result.error && <div style={{ fontSize: '9px', color: 'var(--red)' }}>{result.error}</div>}
        </div>
      )}
    </div>
  );
};

export const PingTesterExpandedWorkbench: React.FC = () => {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<PingResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doPing = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    const target = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    try {
      const available = await checkApiAvailability();
      if (!available) {
        const start = Date.now();
        try {
          await fetch(target, { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
          setResults(prev => [...prev, { id: `p-${Date.now()}`, name: target, url: target, status: 'operational', httpCode: 0, latencyMs: Date.now() - start, uptime24h: 0, checkedAt: new Date().toISOString() }]);
        } catch {
          setResults(prev => [...prev, { id: `p-${Date.now()}`, name: target, url: target, status: 'down', httpCode: 0, latencyMs: Date.now() - start, uptime24h: 0, checkedAt: new Date().toISOString(), error: 'Unreachable' }]);
        }
      } else {
        const data = await pingCustomUrls([target]);
        if (data.endpoints[0]) setResults(prev => [...prev, data.endpoints[0]]);
      }
      soundFx.playClick(1100);
    } catch { soundFx.playClick(300); }
    finally { setLoading(false); }
  }, [url]);

  const avgLatency = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length) : 0;

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>PING TESTER</span></div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input className="tui-input" style={{ flex: 1, height: '24px' }} placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && doPing()} />
          <button className="btn-accent" onClick={doPing} disabled={loading}>{loading ? '⏳' : '⚡ Ping'}</button>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginTop: '4px' }}>Quick targets:</div>
        {['https://google.com', 'https://1.1.1.1', 'https://github.com', 'https://03.0x101.lol'].map(t => (
          <div key={t} style={{ fontSize: '9px', color: 'var(--cyan)', cursor: 'pointer', padding: '2px 0' }} onClick={() => { setUrl(t); }}>
            → {t}
          </div>
        ))}
        <div className="exp-metric-grid" style={{ marginTop: '8px' }}>
          <div className="exp-metric-box"><div className="exp-metric-label">PROBES</div><div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{results.length}</div></div>
          <div className="exp-metric-box"><div className="exp-metric-label">AVG RTT</div><div className="exp-metric-val" style={{ color: 'var(--green)' }}>{avgLatency}ms</div></div>
        </div>
      </div>
      <div className="workbench-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>PING HISTORY ({results.length})</span>
          {results.length > 0 && <button className="btn-accent" style={{ fontSize: '9px' }} onClick={() => setResults([])}>Clear</button>}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="tui-table">
            <thead><tr><th>URL</th><th>STATUS</th><th>RTT</th><th>CODE</th><th>TIME</th></tr></thead>
            <tbody>
              {results.slice().reverse().map((r, i) => (
                <tr key={i}>
                  <td style={{ color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</td>
                  <td style={{ color: statusColor(r.status) }}>{r.status}</td>
                  <td style={{ color: r.latencyMs > 500 ? 'var(--yellow)' : 'var(--green)' }}>{r.latencyMs}ms</td>
                  <td>{r.httpCode || '—'}</td>
                  <td style={{ color: 'var(--fg-dim)', fontSize: '9px' }}>{new Date(r.checkedAt).toLocaleTimeString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && <div style={{ color: 'var(--fg-dim)', textAlign: 'center', padding: '20px', fontSize: '10px' }}>No probes yet. Enter a URL and click Ping.</div>}
        </div>
      </div>
    </div>
  );
};

// ─── D8: DNS Resolution Check ────────────────────────────────────────────────
// Uses Cloudflare DoH (DNS over HTTPS) API — works from browser!
interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

const DNS_TYPES: Record<string, number> = { A: 1, AAAA: 28, CNAME: 5, MX: 15, TXT: 16, NS: 2, SOA: 6, SRV: 33 };
const DNS_TYPE_NAMES: Record<number, string> = Object.fromEntries(Object.entries(DNS_TYPES).map(([k, v]) => [v, k]));

export const DnsCheckWidget: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState('A');

  const resolve = useCallback(async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setRecords([]);
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain.trim())}&type=${queryType}`, {
        headers: { Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      setRecords(data.Answer || []);
      soundFx.playClick(1100);
    } catch {
      soundFx.playClick(300);
    } finally {
      setLoading(false);
    }
  }, [domain, queryType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <input className="tui-input" style={{ flex: 1, height: '22px', fontSize: '9.5px' }} placeholder="example.com" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && resolve()} />
        <select className="tui-input" style={{ width: '55px', height: '22px', fontSize: '9px' }} value={queryType} onChange={e => setQueryType(e.target.value)}>
          {Object.keys(DNS_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn-accent" style={{ fontSize: '9px' }} onClick={resolve} disabled={loading}>{loading ? '⏳' : '🔍'}</button>
      </div>
      {records.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="tui-table">
            <thead><tr><th>TYPE</th><th>VALUE</th><th>TTL</th></tr></thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--cyan)' }}>{DNS_TYPE_NAMES[r.type] || r.type}</td>
                  <td style={{ color: '#fff', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.data}</td>
                  <td style={{ color: 'var(--fg-dim)' }}>{r.TTL}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {records.length === 0 && !loading && domain && <div style={{ color: 'var(--fg-dim)', fontSize: '9px' }}>No records found</div>}
    </div>
  );
};

export const DnsCheckExpandedWorkbench: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [allRecords, setAllRecords] = useState<Record<string, DnsRecord[]>>({});
  const [loading, setLoading] = useState(false);

  const resolveAll = useCallback(async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setAllRecords({});
    const types = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'];
    const results: Record<string, DnsRecord[]> = {};
    await Promise.all(types.map(async (type) => {
      try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain.trim())}&type=${type}`, {
          headers: { Accept: 'application/dns-json' },
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (data.Answer?.length > 0) results[type] = data.Answer;
      } catch {}
    }));
    setAllRecords(results);
    setLoading(false);
    soundFx.playClick(1100);
  }, [domain]);

  const totalRecords = Object.values(allRecords).reduce((s, r) => s + r.length, 0);

  return (
    <div className="workbench-split">
      <div className="workbench-left" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="workbench-bar"><span>DNS RESOLUTION</span></div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input className="tui-input" style={{ flex: 1, height: '24px' }} placeholder="example.com" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && resolveAll()} />
          <button className="btn-accent" onClick={resolveAll} disabled={loading}>{loading ? '⏳' : '🔍 Resolve All'}</button>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginTop: '4px' }}>Quick domains:</div>
        {['03.0x101.lol', 'google.com', 'github.com', 'cloudflare.com'].map(d => (
          <div key={d} style={{ fontSize: '9px', color: 'var(--cyan)', cursor: 'pointer', padding: '2px 0' }} onClick={() => setDomain(d)}>→ {d}</div>
        ))}
        <div className="exp-metric-grid" style={{ marginTop: '8px' }}>
          <div className="exp-metric-box"><div className="exp-metric-label">TYPES FOUND</div><div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{Object.keys(allRecords).length}</div></div>
          <div className="exp-metric-box"><div className="exp-metric-label">RECORDS</div><div className="exp-metric-val" style={{ color: 'var(--green)' }}>{totalRecords}</div></div>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginTop: '4px' }}>Powered by Cloudflare DoH API</div>
      </div>
      <div className="workbench-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'auto' }}>
        <div className="workbench-bar"><span>DNS RECORDS: {domain || '—'}</span></div>
        {Object.entries(allRecords).map(([type, recs]) => (
          <div key={type}>
            <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '2px', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>{type} Records ({recs.length})</div>
            <table className="tui-table" style={{ marginBottom: '6px' }}>
              <thead><tr><th>VALUE</th><th>TTL</th></tr></thead>
              <tbody>
                {recs.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: '#fff', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.data}</td>
                    <td style={{ color: 'var(--fg-dim)' }}>{r.TTL}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {totalRecords === 0 && !loading && <div style={{ color: 'var(--fg-dim)', textAlign: 'center', padding: '20px' }}>Enter a domain and click Resolve All</div>}
        {loading && <div style={{ color: 'var(--yellow)', textAlign: 'center', padding: '20px' }}>⏳ Resolving A, AAAA, CNAME, MX, NS, TXT…</div>}
      </div>
    </div>
  );
};
