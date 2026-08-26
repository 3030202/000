import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Radio, 
  Zap, 
  Server, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { HealthEndpoint } from '../types';
import { soundFx } from '../services/soundFx';

interface MonitoringPanelProps {
  endpoints: HealthEndpoint[];
  onTriggerCheck: () => void;
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({
  endpoints,
  onTriggerCheck
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [customTestUrl, setCustomTestUrl] = useState('');
  const [customPingResult, setCustomPingResult] = useState<{ status: string; latency: number; code: number } | null>(null);

  const handleManualProbe = () => {
    soundFx.playClick(900);
    setIsPinging(true);
    onTriggerCheck();
    setTimeout(() => {
      soundFx.playDeploySuccess();
      setIsPinging(false);
    }, 1200);
  };

  const handleCustomPing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestUrl) return;
    soundFx.playClick(1000);
    setIsPinging(true);
    setTimeout(() => {
      const simLatency = Math.floor(Math.random() * 45) + 12;
      setCustomPingResult({
        status: '200 OK',
        latency: simLatency,
        code: 200
      });
      setIsPinging(false);
      soundFx.playDeploySuccess();
    }, 600);
  };

  // Sparkline generator helper
  const renderSparkline = (history: number[]) => {
    if (!history || history.length === 0) return null;
    const max = Math.max(...history, 50);
    const min = Math.min(...history, 0);
    const range = max - min || 1;
    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1 || 1)) * 120;
      const y = 30 - ((val - min) / range) * 26;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-28 h-8 overflow-visible" viewBox="0 0 120 30">
        <polyline
          fill="none"
          stroke="#00f5a0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {history.map((val, idx) => {
          const x = (idx / (history.length - 1 || 1)) * 120;
          const y = 30 - ((val - min) / range) * 26;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="2"
              className="fill-emerald-400"
            />
          );
        })}
      </svg>
    );
  };

  const operationalCount = endpoints.filter(e => e.status === 'operational').length;
  const avgLatency = Math.round(endpoints.reduce((acc, curr) => acc + curr.latencyMs, 0) / (endpoints.length || 1));

  return (
    <div className="space-y-6">
      {/* Top Metric Overview HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Health Status</div>
            <div className="text-xl font-black text-white font-heading">
              {operationalCount}/{endpoints.length} <span className="text-xs font-normal text-emerald-400">NOMINAL</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Subdomain RTT</div>
            <div className="text-xl font-black text-cyan-300 font-mono">
              8 ms <span className="text-xs font-normal text-slate-400">000.localhost</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Average Latency</div>
            <div className="text-xl font-black text-purple-300 font-mono">
              {avgLatency} ms
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Global SLA 24h</div>
            <div className="text-xl font-black text-amber-300 font-mono">
              99.98%
            </div>
          </div>
        </div>
      </div>

      {/* Main Endpoints Matrix Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-heading">
              LIVE ENDPOINT TELEMETRY & HEARTBEATS
            </h3>
          </div>

          <button
            onClick={handleManualProbe}
            disabled={isPinging}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Probing Nodes...' : 'Probe All Nodes'}</span>
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {endpoints.map((ep) => {
            const isOp = ep.status === 'operational';
            const isDeg = ep.status === 'degraded';

            return (
              <div
                key={ep.id}
                className="p-4 hover:bg-white/5 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`relative flex h-3 w-3 shrink-0`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOp ? 'bg-emerald-400' : isDeg ? 'bg-amber-400' : 'bg-rose-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      isOp ? 'bg-emerald-500' : isDeg ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></span>
                  </span>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-sm font-heading">{ep.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {ep.category}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate">{ep.url}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 shrink-0 self-end md:self-center">
                  {/* Sparkline */}
                  <div className="hidden sm:block">
                    <div className="text-[9px] font-mono text-slate-500 mb-0.5 text-right">LATENCY TREND</div>
                    {renderSparkline(ep.history)}
                  </div>

                  {/* Realtime Latency Badge */}
                  <div className="text-right font-mono">
                    <div className={`text-base font-bold ${isOp ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {ep.latencyMs} ms
                    </div>
                    <div className="text-[10px] text-slate-500">24h Uptime: {ep.uptime24h}%</div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${
                    isOp 
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                  }`}>
                    {ep.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instant Endpoint Tester Tool */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
        <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive On-Demand HTTP & TLS Ping Tester</span>
        </h4>

        <form onSubmit={handleCustomPing} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            required
            value={customTestUrl}
            onChange={(e) => setCustomTestUrl(e.target.value)}
            placeholder="https://000.localhost:3000 or custom host..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition shrink-0"
          >
            Send Synthetic Ping
          </button>
        </form>

        {customPingResult && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/30 font-mono text-xs text-slate-300 flex items-center justify-between">
            <span className="text-emerald-400 font-bold">{customPingResult.status}</span>
            <span>Latency: <strong className="text-cyan-300">{customPingResult.latency} ms</strong></span>
            <span className="text-slate-500">HTTP Response: 200</span>
          </div>
        )}
      </div>
    </div>
  );
};
