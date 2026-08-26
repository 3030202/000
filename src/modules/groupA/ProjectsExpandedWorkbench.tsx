import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

export const ProjectsExpandedWorkbench: React.FC = () => {
  const { projects, selectedProjectId, setSelectedProjectId } = useDashboard();
  const { inspectorLog, setInspectorLog, addLog } = useTools();

  const curProj = projects.find(p => p.id === selectedProjectId) || projects[0];
  if (!curProj) return null;

  return (
    <div className="workbench-split">
      {/* Left Project List */}
      <div className="workbench-left">
        <div className="workbench-bar">
          <span>PROJECT REPOSITORY ({projects.length})</span>
          <span className="pill green">ALL ONLINE</span>
        </div>
        <div className="workbench-list">
          {projects.map(p => (
            <div 
              key={p.id} 
              className={`wb-item-row ${p.id === curProj.id ? 'selected' : ''}`}
              onClick={() => { soundFx.playClick(800); setSelectedProjectId(p.id); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{p.name}</span>
                <span className="pill cyan">{p.env}</span>
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--fg-dim)' }}>{p.category} • {p.latency}ms</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Deep Inspector Pane */}
      <div className="workbench-right">
        <div className="workbench-bar">
          <span>INSPECTOR: {curProj.name.toUpperCase()}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span className="pill green">[REPLICAS: 3/3]</span>
            <span className="pill cyan">[HTTP/2 TLS 1.3]</span>
          </div>
        </div>

        <div className="workbench-detail-body">
          {/* Metric Summary Strip */}
          <div className="exp-metric-grid">
            <div className="exp-metric-box">
              <div className="exp-metric-label">STATUS</div>
              <div className="exp-metric-val" style={{ color: 'var(--green)' }}>● {curProj.status.toUpperCase()}</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">LATENCY RTT</div>
              <div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{curProj.latency} ms</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">CLUSTER ZONE</div>
              <div className="exp-metric-val">us-central1</div>
            </div>
            <div className="exp-metric-box">
              <div className="exp-metric-label">IMAGE DIGEST</div>
              <div className="exp-metric-val" style={{ color: 'var(--purple)' }}>sha-89f2ab4</div>
            </div>
          </div>

          {/* Description and Info */}
          <div style={{ background: '#030509', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
            <div style={{ color: 'var(--fg)', fontWeight: 600 }}>{curProj.tagline}</div>
            <div style={{ color: 'var(--fg-dim)', fontSize: '10px', marginTop: '2px' }}>{curProj.description}</div>
          </div>

          {/* Action Runbooks Strip */}
          <div>
            <div style={{ fontSize: '9.5px', color: 'var(--fg-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              OPERATIONAL RUNBOOKS & ACTIONS
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button className="btn-accent" onClick={() => {
                soundFx.playDeploySuccess();
                setInspectorLog(`[RUNBOOK] Dispatched Staging Build for ${curProj.name} -> SUCCESS in 3.4s`);
                addLog('DEPLOY', `Dispatched build for ${curProj.name}`, 'success');
              }}>⚡ [Trigger Staging Deploy]</button>

              <button onClick={() => {
                soundFx.playClick(900);
                setInspectorLog(`[LOGS STREAM] ${curProj.name}: [200 OK] GET /api/v1/health (12ms) - Worker thread #4`);
              }}>📄 [View Container Logs]</button>

              <button onClick={() => {
                soundFx.playClick(900);
                setInspectorLog(`[CACHE PURGE] Purged 1,420 cached edge objects for route: ${curProj.links[0]?.url}`);
              }}>🔄 [Purge Route Cache]</button>

              {curProj.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer">
                  <button>[Open {l.label} ↗]</button>
                </a>
              ))}
            </div>
          </div>

          {/* Live Curl Runner */}
          <div style={{ background: '#020306', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold' }}>LIVE CURL TEST RUNNER</span>
              <button className="btn-accent" onClick={() => {
                soundFx.playDeploySuccess();
                setInspectorLog(`HTTP/2 200 OK\ncontent-type: application/json\nx-request-id: req-${Math.random().toString(16).substring(2, 8)}\n\n{\n  "status": "nominal",\n  "service": "${curProj.name}",\n  "latency_ms": ${curProj.latency}\n}`);
              }}>[Execute Probe]</button>
            </div>
            <input 
              type="text" 
              readOnly 
              value={`curl -X GET "${curProj.links[0]?.url || 'http://000.localhost:3000'}" -H "Accept: application/json"`} 
              style={{ width: '100%', color: 'var(--yellow)' }} 
            />
          </div>

          {/* Inspector Output Terminal */}
          {inspectorLog && (
            <pre style={{ background: '#000', padding: '6px', border: '1px solid var(--cyan)', color: 'var(--green)', fontSize: '10px', borderRadius: '3px', maxHeight: '100px', overflowY: 'auto' }}>
              {inspectorLog}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
