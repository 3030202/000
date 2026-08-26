import React, { useRef, useEffect, useState } from 'react';
import { Network, Server, Globe, Cpu, Database, Cloud, Radio, RefreshCw } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface Node {
  id: string;
  label: string;
  sublabel: string;
  type: 'hub' | 'cloud' | 'db' | 'ai' | 'client';
  x: number;
  y: number;
  status: 'nominal' | 'active' | 'warning';
  connections: string[];
}

export const TopologyView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const nodes: Node[] = [
    { id: 'hub', label: '000 Master Gateway', sublabel: '000.localhost:3000', type: 'hub', x: 0.5, y: 0.5, status: 'nominal', connections: ['gcp', 'gemini', 'db', 'fb', 'clients'] },
    { id: 'gcp', label: 'Cloud Run Cluster', sublabel: 'REST & gRPC Microservices', type: 'cloud', x: 0.25, y: 0.28, status: 'nominal', connections: ['db'] },
    { id: 'gemini', label: 'Gemini AI Live API', sublabel: 'Agents & Structured RAG', type: 'ai', x: 0.75, y: 0.28, status: 'nominal', connections: ['db'] },
    { id: 'db', label: 'Cloud SQL / BigQuery', sublabel: 'PostgreSQL & Analytics', type: 'db', x: 0.5, y: 0.15, status: 'nominal', connections: [] },
    { id: 'fb', label: 'Firebase Datastore', sublabel: 'Realtime Sync & Rules', type: 'cloud', x: 0.2, y: 0.72, status: 'nominal', connections: ['clients'] },
    { id: 'clients', label: 'Client Apps & Web', sublabel: 'Subdomain Ingress', type: 'client', x: 0.8, y: 0.72, status: 'nominal', connections: [] }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let packetOffset = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 460;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      packetOffset = (packetOffset + 0.008) % 1;

      // Draw Connection Lines & Flowing Packets
      nodes.forEach((node) => {
        const startX = node.x * canvas.width;
        const startY = node.y * canvas.height;

        node.connections.forEach((targetId) => {
          const target = nodes.find(n => n.id === targetId);
          if (!target) return;

          const endX = target.x * canvas.width;
          const endY = target.y * canvas.height;

          // Draw Glowing Cyber Line
          const grad = ctx.createLinearGradient(startX, startY, endX, endY);
          grad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
          grad.addColorStop(1, 'rgba(157, 78, 221, 0.4)');

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw Animated Flowing Packet
          const packetX = startX + (endX - startX) * packetOffset;
          const packetY = startY + (endY - startY) * packetOffset;

          ctx.beginPath();
          ctx.arc(packetX, packetY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#00f2fe';
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow
        });
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const nx = node.x * canvas.width;
        const ny = node.y * canvas.height;
        const isHub = node.type === 'hub';
        const isSelected = selectedNode?.id === node.id;
        const radius = isHub ? 32 : 24;

        // Outer Glow Ring
        ctx.beginPath();
        ctx.arc(nx, ny, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = isHub 
          ? 'rgba(0, 242, 254, 0.3)' 
          : isSelected 
          ? 'rgba(255, 183, 3, 0.5)' 
          : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node Inner Circle
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHub ? '#091528' : '#0e1424';
        ctx.fill();
        ctx.strokeStyle = isHub ? '#00f2fe' : '#7f00ff';
        ctx.lineWidth = isHub ? 2.5 : 1.5;
        ctx.stroke();

        // Node Text
        ctx.font = isHub ? 'bold 12px Outfit, sans-serif' : '11px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, nx, ny + radius + 16);

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(node.sublabel, nx, ny + radius + 28);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / canvas.width;
    const clickY = (e.clientY - rect.top) / canvas.height;

    const clicked = nodes.find(n => {
      const dist = Math.hypot(n.x - clickX, n.y - clickY);
      return dist < 0.08;
    });

    if (clicked) {
      soundFx.playClick(1000);
      setSelectedNode(clicked);
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              INTERACTIVE CYBER TOPOLOGY MAP
            </h2>
            <p className="text-xs text-slate-400">
              Real-time visualization of mesh communication channels, routing pathways, and packet telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-500/30">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>MESH STATE: SYNCHRONIZED</span>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative glass-panel rounded-2xl border border-cyan-500/30 overflow-hidden bg-[#070a12] p-2 shadow-2xl">
        <div className="absolute top-4 left-4 z-10 font-mono text-[10px] text-slate-500 flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            <span>Gateway Ingress</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
            <span>Microservice Mesh</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>Nominal SLA</span>
          </span>
        </div>

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer"
        />

        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-10 p-4 bg-slate-900/95 border border-cyan-500/50 rounded-xl shadow-2xl max-w-xs font-mono animate-in fade-in">
            <div className="text-xs font-bold text-white font-heading flex items-center justify-between">
              <span>{selectedNode.label}</span>
              <span className="text-[10px] text-emerald-400 uppercase">ONLINE</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{selectedNode.sublabel}</div>
            <div className="text-[10px] text-slate-500 mt-2">
              Active Ingress Routes: {selectedNode.connections.length || 'Terminal Node'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
