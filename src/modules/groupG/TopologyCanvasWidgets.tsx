import React, { useRef, useEffect, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

interface TopologyNode {
  id: string;
  label: string;
  sublabel: string;
  x: number; // 0..1 percentage of canvas
  y: number; // 0..1 percentage of canvas
  vx?: number;
  vy?: number;
  baseX?: number;
  baseY?: number;
  radius: number;
  color: string;
  status: 'operational' | 'nominal' | 'degraded' | 'proxied';
  latencyMs: number;
  proto: string;
  port: string;
  traffic: string;
  rps: number;
}

interface TopologyLink {
  from: string;
  to: string;
  label?: string;
  color?: string;
}

interface Packet {
  fromId: string;
  toId: string;
  progress: number; // 0..1
  speed: number;
  color: string;
}

const INITIAL_NODES: TopologyNode[] = [
  { id: 'gateway', label: '000 INGRESS', sublabel: '000.localhost', x: 0.50, y: 0.50, radius: 18, color: '#38bdf8', status: 'nominal', latencyMs: 8, proto: 'HTTP/3', port: '3000', traffic: '1.4 Gbps', rps: 840 },
  { id: 'cloudflare', label: 'CLOUDFLARE EDGE', sublabel: 'WAF / CDN Proxy', x: 0.50, y: 0.16, radius: 14, color: '#facc15', status: 'proxied', latencyMs: 12, proto: 'TLS 1.3', port: '443', traffic: '3.2 Gbps', rps: 1420 },
  { id: 'cloudrun', label: 'CLOUD RUN CORE', sublabel: 'gRPC Microservices', x: 0.22, y: 0.32, radius: 14, color: '#4ade80', status: 'operational', latencyMs: 24, proto: 'gRPC / HTTP/2', port: '8080', traffic: '420 Mbps', rps: 310 },
  { id: 'gemini', label: 'GEMINI AI ENGINE', sublabel: 'Agent RAG Pipeline', x: 0.78, y: 0.32, radius: 14, color: '#c084fc', status: 'operational', latencyMs: 34, proto: 'HTTPS API', port: '443', traffic: '180 Mbps', rps: 95 },
  { id: 'postgres', label: 'POSTGRES MASTER', sublabel: 'Cloud SQL Cluster', x: 0.22, y: 0.72, radius: 14, color: '#4ade80', status: 'operational', latencyMs: 14, proto: 'TCP / SSL', port: '5432', traffic: '240 Mbps', rps: 520 },
  { id: 'redis', label: 'REDIS CACHE', sublabel: 'Memory Store L1', x: 0.50, y: 0.84, radius: 12, color: '#f87171', status: 'operational', latencyMs: 2, proto: 'RESP TCP', port: '6379', traffic: '650 Mbps', rps: 1840 },
  { id: 'telegram', label: 'TELEGRAM GATEWAY', sublabel: 'Incident Alerts', x: 0.78, y: 0.72, radius: 13, color: '#38bdf8', status: 'nominal', latencyMs: 45, proto: 'WSS / REST', port: '443', traffic: '12 Mbps', rps: 18 },
];

const INITIAL_LINKS: TopologyLink[] = [
  { from: 'cloudflare', to: 'gateway' },
  { from: 'gateway', to: 'cloudrun' },
  { from: 'gateway', to: 'gemini' },
  { from: 'cloudrun', to: 'postgres' },
  { from: 'cloudrun', to: 'redis' },
  { from: 'gateway', to: 'telegram' },
  { from: 'gemini', to: 'postgres' },
];

export const InteractiveCyberTopologyWidget: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const nodes = INITIAL_NODES.map(n => ({ ...n }));
    const links = INITIAL_LINKS;

    // Packets
    const packets: Packet[] = [
      { fromId: 'cloudflare', toId: 'gateway', progress: 0.2, speed: 0.015, color: '#facc15' },
      { fromId: 'gateway', toId: 'cloudrun', progress: 0.6, speed: 0.018, color: '#38bdf8' },
      { fromId: 'gateway', toId: 'gemini', progress: 0.4, speed: 0.012, color: '#c084fc' },
      { fromId: 'cloudrun', toId: 'postgres', progress: 0.8, speed: 0.022, color: '#4ade80' },
      { fromId: 'cloudrun', toId: 'redis', progress: 0.1, speed: 0.025, color: '#f87171' },
      { fromId: 'gateway', toId: 'telegram', progress: 0.7, speed: 0.014, color: '#38bdf8' },
    ];

    let t = 0;

    const render = () => {
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      t += 0.03;
      ctx.clearRect(0, 0, w, h);

      // 1. Draw Links
      links.forEach(l => {
        const from = nodes.find(n => n.id === l.from);
        const to = nodes.find(n => n.id === l.to);
        if (!from || !to) return;

        const x1 = from.x * w;
        const y1 = from.y * h;
        const x2 = to.x * w;
        const y2 = to.y * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 2. Draw & Advance Packets
      packets.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) p.progress = 0;

        const from = nodes.find(n => n.id === p.fromId);
        const to = nodes.find(n => n.id === p.toId);
        if (!from || !to) return;

        const px = (from.x + (to.x - from.x) * p.progress) * w;
        const py = (from.y + (to.y - from.y) * p.progress) * h;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Draw Nodes
      nodes.forEach(n => {
        const nx = n.x * w;
        const ny = n.y * h;

        // Pulse ring
        const pulse = Math.sin(t + n.radius) * 3;
        ctx.beginPath();
        ctx.arc(nx, ny, n.radius + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `${n.color}44`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core Circle
        ctx.beginPath();
        ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#060912';
        ctx.fill();
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, nx, ny + n.radius + 9);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '140px', position: 'relative', background: '#020306', borderRadius: '3px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '8.5px', color: 'var(--cyan)' }}>
        ● LIVE TOPOLOGY (7 NODES)
      </div>
    </div>
  );
};

export const InteractiveCyberTopologyWorkbench: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addLog } = useTools();

  const [nodes, setNodes] = useState<TopologyNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('gateway');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const links = INITIAL_LINKS;

    const packets: Packet[] = [
      { fromId: 'cloudflare', toId: 'gateway', progress: 0.2, speed: 0.015, color: '#facc15' },
      { fromId: 'gateway', toId: 'cloudrun', progress: 0.6, speed: 0.018, color: '#38bdf8' },
      { fromId: 'gateway', toId: 'gemini', progress: 0.4, speed: 0.012, color: '#c084fc' },
      { fromId: 'cloudrun', toId: 'postgres', progress: 0.8, speed: 0.022, color: '#4ade80' },
      { fromId: 'cloudrun', toId: 'redis', progress: 0.1, speed: 0.025, color: '#f87171' },
      { fromId: 'gateway', toId: 'telegram', progress: 0.7, speed: 0.014, color: '#38bdf8' },
      { fromId: 'gemini', toId: 'postgres', progress: 0.5, speed: 0.016, color: '#c084fc' },
    ];

    let t = 0;

    const render = () => {
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      if (!isFrozen) t += 0.03 * simSpeed;
      ctx.clearRect(0, 0, w, h);

      // Background Grid Dots
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      for (let gx = 10; gx < w; gx += 20) {
        for (let gy = 10; gy < h; gy += 20) {
          ctx.fillRect(gx, gy, 1, 1);
        }
      }

      // 1. Draw Links
      links.forEach(l => {
        const from = nodes.find(n => n.id === l.from);
        const to = nodes.find(n => n.id === l.to);
        if (!from || !to) return;

        const x1 = from.x * w;
        const y1 = from.y * h;
        const x2 = to.x * w;
        const y2 = to.y * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = from.id === selectedNodeId || to.id === selectedNodeId
          ? 'rgba(56, 189, 248, 0.5)'
          : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = from.id === selectedNodeId || to.id === selectedNodeId ? 2 : 1;
        ctx.stroke();
      });

      // 2. Draw & Advance Packets
      if (!isFrozen) {
        packets.forEach(p => {
          p.progress += p.speed * simSpeed;
          if (p.progress >= 1) p.progress = 0;

          const from = nodes.find(n => n.id === p.fromId);
          const to = nodes.find(n => n.id === p.toId);
          if (!from || !to) return;

          const px = (from.x + (to.x - from.x) * p.progress) * w;
          const py = (from.y + (to.y - from.y) * p.progress) * h;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // 3. Draw Nodes
      nodes.forEach(n => {
        const nx = n.x * w;
        const ny = n.y * h;
        const isSelected = n.id === selectedNodeId;

        // Pulse ring
        const pulse = Math.sin(t + n.radius) * 4;
        ctx.beginPath();
        ctx.arc(nx, ny, n.radius + pulse + (isSelected ? 6 : 0), 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.8)' : `${n.color}33`;
        ctx.lineWidth = isSelected ? 1.8 : 1;
        ctx.stroke();

        // Node Body
        ctx.beginPath();
        ctx.arc(nx, ny, n.radius + (isSelected ? 2 : 0), 0, Math.PI * 2);
        ctx.fillStyle = '#060912';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : n.color;
        ctx.lineWidth = isSelected ? 2.5 : 1.6;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = isSelected ? 16 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Node Inner Icon / Dot
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Label
        ctx.fillStyle = isSelected ? 'var(--cyan)' : '#ffffff';
        ctx.font = isSelected ? 'bold 9.5px monospace' : '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, nx, ny + n.radius + 11);

        ctx.fillStyle = 'var(--fg-muted)';
        ctx.font = '8px monospace';
        ctx.fillText(`${n.latencyMs}ms • ${n.port}`, nx, ny + n.radius + 20);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [nodes, selectedNodeId, isFrozen, simSpeed]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    // Find clicked node
    const clicked = nodes.find(n => {
      const dx = (n.x - mx) * rect.width;
      const dy = (n.y - my) * rect.height;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 10;
    });

    if (clicked) {
      soundFx.playClick(900);
      setSelectedNodeId(clicked.id);
      setDraggedNodeId(clicked.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNodeId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
    const my = Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height));

    setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: mx, y: my } : n));
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  const handleResetPositions = () => {
    soundFx.playClick(1000);
    setNodes(INITIAL_NODES);
    addLog('TOPOLOGY', 'Reset node physics layout', 'info');
  };

  const handleProbeSelected = () => {
    soundFx.playClick(900);
    setProbeResult(`PROBING ${selectedNode.label} [${selectedNode.proto}:${selectedNode.port}]...`);
    setTimeout(() => {
      soundFx.playDeploySuccess();
      const lat = Math.floor(Math.random() * 10) + selectedNode.latencyMs - 3;
      setProbeResult(`200 OK | RTT: ${Math.max(1, lat)}ms | Jitter: 0.4ms | Loss: 0% | Bandwidth: ${selectedNode.traffic}`);
      addLog('TOPOLOGY', `Probed ${selectedNode.label} -> ${Math.max(1, lat)}ms`, 'success');
    }, 350);
  };

  return (
    <div className="workbench-split">
      {/* Left Column: Interactive Canvas */}
      <div className="workbench-left" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', background: '#020306', borderBottom: '1px solid var(--border)', zIndex: 5 }}>
          <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold' }}>
            TOPOLOGY MESH CANVAS (7 ACTIVE NODES)
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button onClick={handleResetPositions} style={{ fontSize: '8.5px' }}>
              🔄 Reset Layout
            </button>
            <button onClick={() => setIsFrozen(f => !f)} className={isFrozen ? 'btn-accent' : ''} style={{ fontSize: '8.5px' }}>
              {isFrozen ? '▶ Resume' : '⏸ Freeze'}
            </button>
            <button onClick={() => setSimSpeed(s => s === 1 ? 2 : 1)} style={{ fontSize: '8.5px' }}>
              ⚡ {simSpeed}x Speed
            </button>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', cursor: draggedNodeId ? 'grabbing' : 'grab' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <div style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '9px', color: 'var(--fg-muted)', pointerEvents: 'none' }}>
            💡 Drag nodes to reposition • Click to inspect telemetry
          </div>
        </div>
      </div>

      {/* Right Column: Node Inspector */}
      <div className="workbench-right" style={{ gap: '6px' }}>
        <div className="exp-metric-grid">
          <div className="exp-metric-box">
            <div className="exp-metric-label">SELECTED NODE</div>
            <div className="exp-metric-val" style={{ color: selectedNode.color, fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {selectedNode.label}
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">RTT LATENCY</div>
            <div className="exp-metric-val" style={{ color: 'var(--green)' }}>{selectedNode.latencyMs}ms</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">STATUS</div>
            <div className="exp-metric-val" style={{ color: selectedNode.status === 'operational' ? 'var(--green)' : 'var(--cyan)', textTransform: 'uppercase' }}>
              {selectedNode.status}
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">RPS RATE</div>
            <div className="exp-metric-val">{selectedNode.rps} /s</div>
          </div>
        </div>

        <div style={{ background: '#04060a', border: '1px solid var(--border)', padding: '6px', borderRadius: '3px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
            NODE TELEMETRY & SPECIFICATION
          </div>
          <table className="tui-table">
            <tbody>
              <tr>
                <td style={{ color: 'var(--fg-muted)', width: '90px' }}>IDENTIFIER</td>
                <td style={{ color: '#fff', fontWeight: 'bold' }}>{selectedNode.id}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>SERVICE NAME</td>
                <td style={{ color: 'var(--cyan)' }}>{selectedNode.sublabel}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>PROTOCOL</td>
                <td>{selectedNode.proto}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>PORT BINDING</td>
                <td style={{ color: 'var(--yellow)', fontFamily: 'monospace' }}>:{selectedNode.port}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>THROUGHPUT</td>
                <td style={{ color: 'var(--green)' }}>{selectedNode.traffic}</td>
              </tr>
            </tbody>
          </table>

          <button className="btn-accent" onClick={handleProbeSelected} style={{ marginTop: '4px', width: '100%', padding: '4px' }}>
            📡 Execute Synthetic ICMP / HTTP Probe
          </button>

          {probeResult && (
            <div style={{ background: '#000', border: '1px solid var(--border)', padding: '4px', color: probeResult.includes('200 OK') ? 'var(--green)' : 'var(--yellow)', fontSize: '9.5px', marginTop: '2px', fontFamily: 'monospace' }}>
              {probeResult}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '90px' }}>
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', fontWeight: 'bold', marginBottom: '2px' }}>
            TOPOLOGY LINK MATRIX
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#020305', border: '1px solid var(--border)', padding: '4px' }}>
            {INITIAL_LINKS.filter(l => l.from === selectedNode.id || l.to === selectedNode.id).map((l, i) => (
              <div key={i} style={{ fontSize: '9.5px', padding: '2px 0', borderBottom: '1px solid #101522', color: 'var(--fg-dim)' }}>
                ⚡ Link: <span style={{ color: 'var(--cyan)' }}>{l.from}</span> ──➔ <span style={{ color: 'var(--green)' }}>{l.to}</span> (nominal, 0% loss)
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
