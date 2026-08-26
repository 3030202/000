import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

export const HealthExpandedWorkbench: React.FC = () => {
  const { healthEndpoints, selectedEndpointId, setSelectedEndpointId } = useDashboard();
  const { inspectorLog, setInspectorLog } = useTools();

  const curEp = healthEndpoints.find(e => e.id === selectedEndpointId) || healthEndpoints[0];
  if (!curEp) return null;

  return (
    <div className="workbench-split">
      {/* Left Endpoints List */}
      <div className="workbench-left">
        <div className="workbench-bar">
          <span>HEALTH ENDPOINTS ({healthEndpoints.length})</span>
          <span className="pill green">ALL PROBED</span>
        </div>
        <div className="workbench-list">
          {healthEndpoints.map(e => (
            <div 
              key={e.id} 
              className={`wb-item-row ${e.id === curEp.id ? 'selected' : ''}`}
              onClick={() => { soundFx.playClick(800); setSelectedEndpointId(e.id); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{e.name}</span>
                <span className="pill green">{e.latencyMs}ms</span>
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--fg-dim)' }}>{e.category} • SLA: {e.uptime24h}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Telemetry Lab */}
      <div className="workbench-right">
        <div className="workbench-bar">
          <span>TELEMETRY & TLS LAB: {curEp.name}</span>
          <button className="btn-accent" onClick={() => {
            soundFx.playDeploySuccess();
            setInspectorLog(`SYNTHETIC PROBE [${curEp.url}]:\nDNS Lookup: 1.8ms\nTCP Handshake: 3.4ms\nTLS 1.3 Neg: 5.1ms\nTTFB: 11.2ms\nContent Transfer: 2.1ms\nTotal Round-Trip: ${curEp.latencyMs}ms\nCipher: TLS_AES_256_GCM_SHA384\nHTTP Status: 200 OK`);
          }}>[Run Traceroute & TLS Audit]</button>
        </div>

        <div className="workbench-detail-body">
          <div className="exp-metric-grid">
            <div className="exp-metric-box">
              <div className="exp-metric-label">24H UPTIME SLA</div>
              <div className="exp-metric-val" style={{ color: 'var(--green)' }}>{curEp.uptime24h}%</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">AVG LATENCY</div>
              <div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{curEp.latencyMs} ms</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">PROTOCOL</div>
              <div className="exp-metric-val">HTTP/2 TLS 1.3</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">CERT EXPIRY</div>
              <div className="exp-metric-val" style={{ color: 'var(--yellow)' }}>342 days</div>
            </div>
          </div>

          {/* Synthetic Breakdown Map */}
          <div style={{ background: '#020306', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px', fontSize: '10px' }}>
            <div style={{ color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '4px' }}>LATENCY WATERFALL BREAKDOWN</div>
            <div className="tui-row"><span>DNS Resolution (1.1.1.1):</span><span style={{ color: 'var(--green)' }}>1.8 ms</span></div>
            <div className="tui-row"><span>TCP Connect Handshake:</span><span style={{ color: 'var(--green)' }}>3.4 ms</span></div>
            <div className="tui-row"><span>TLS 1.3 Cryptographic Exchange:</span><span style={{ color: 'var(--green)' }}>5.1 ms</span></div>
            <div className="tui-row"><span>Server Processing Time (TTFB):</span><span style={{ color: 'var(--cyan)' }}>11.2 ms</span></div>
          </div>

          {inspectorLog && (
            <pre style={{ background: '#000', padding: '6px', border: '1px solid var(--cyan)', color: 'var(--green)', fontSize: '10px', borderRadius: '3px', maxHeight: '120px', overflowY: 'auto' }}>
              {inspectorLog}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
