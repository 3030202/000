import React from 'react';
import { 
  FolderGit2, 
  Key, 
  Box, 
  Activity, 
  ExternalLink, 
  Radio, 
  ShieldCheck, 
  Cloud, 
  GitBranch, 
  Database, 
  Terminal, 
  Sparkles, 
  ArrowRight,
  Zap,
  Globe,
  Layers
} from 'lucide-react';
import { ProjectItem, SecretItem, ArtifactItem, HealthEndpoint, ActiveTab, DefconLevel } from '../types';
import { soundFx } from '../services/soundFx';

interface OverviewProps {
  projects: ProjectItem[];
  secrets: SecretItem[];
  artifacts: ArtifactItem[];
  endpoints: HealthEndpoint[];
  isVaultUnlocked: boolean;
  defcon: DefconLevel;
  onNavigate: (tab: ActiveTab) => void;
  onOpenVault: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  projects,
  secrets,
  artifacts,
  endpoints,
  isVaultUnlocked,
  defcon,
  onNavigate,
  onOpenVault
}) => {
  const starredProjects = projects.filter(p => p.starred);
  const operationalEndpoints = endpoints.filter(e => e.status === 'operational').length;

  const quickResources = [
    { label: '000 Subdomain', desc: '000.localhost:3000', url: 'http://000.localhost:3000', icon: Radio, color: 'text-cyan-400 border-cyan-500/30' },
    { label: 'GCP Cloud Run', desc: 'Container Services', url: 'https://console.cloud.google.com/run', icon: Cloud, color: 'text-blue-400 border-blue-500/30' },
    { label: 'Gemini AI Live', desc: 'Interactions & RAG', url: 'https://ai.google.dev', icon: Sparkles, color: 'text-purple-400 border-purple-500/30' },
    { label: 'BigQuery Studio', desc: 'Data Analytics Hub', url: 'https://console.cloud.google.com/bigquery', icon: Database, color: 'text-amber-400 border-amber-500/30' },
    { label: 'Firebase Console', desc: 'Firestore & Auth', url: 'https://console.firebase.google.com', icon: Layers, color: 'text-orange-400 border-orange-500/30' },
    { label: 'GitHub Repository', desc: 'CI/CD & Source Code', url: 'https://github.com', icon: GitBranch, color: 'text-slate-300 border-white/20' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden glass-panel-glow rounded-3xl p-6 md:p-8 border border-cyan-500/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                HOST BINDING: 000.*
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                DEFCON {defcon} POSTURE
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-heading">
              000 // UNIFIED OPERATIONS DECK
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Centralized mission control for all projects, encrypted zero-knowledge secrets vault, binary artifacts registry, live node telemetry, and instant ops automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                soundFx.playClick(900);
                onNavigate('projects');
              }}
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:scale-105"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenVault}
              className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>{isVaultUnlocked ? 'Access Vault' : 'Unlock Vault'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Card */}
        <div 
          onClick={() => {
            soundFx.playClick(850);
            onNavigate('projects');
          }}
          className="glass-panel hover:bg-slate-900/80 p-5 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 group-hover:translate-x-0.5 transition flex items-center">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-heading">{projects.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Registered Projects & Services</div>
        </div>

        {/* Vault Secrets Card */}
        <div 
          onClick={() => {
            soundFx.playClick(850);
            onNavigate('vault');
          }}
          className="glass-panel hover:bg-slate-900/80 p-5 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
              <Key className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-amber-400 group-hover:translate-x-0.5 transition flex items-center">
              {isVaultUnlocked ? 'Unlocked' : 'Encrypted'} <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-heading">{secrets.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Zero-Knowledge Credentials</div>
        </div>

        {/* Artifacts Card */}
        <div 
          onClick={() => {
            soundFx.playClick(850);
            onNavigate('artifacts');
          }}
          className="glass-panel hover:bg-slate-900/80 p-5 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
              <Box className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 group-hover:translate-x-0.5 transition flex items-center">
              Registry <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-heading">{artifacts.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Builds, Docker & SSL Assets</div>
        </div>

        {/* Live SLA Card */}
        <div 
          onClick={() => {
            soundFx.playClick(850);
            onNavigate('monitoring');
          }}
          className="glass-panel hover:bg-slate-900/80 p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 group-hover:translate-x-0.5 transition flex items-center">
              Telemetry <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-heading">
            {operationalEndpoints}/{endpoints.length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Nodes Nominal (<span className="text-emerald-400 font-mono">8ms RTT</span>)</div>
        </div>
      </div>

      {/* Quick Access Resource Dock */}
      <div>
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
          Quick Access & Cloud Consoles
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickResources.map((res, idx) => {
            const Icon = res.icon;
            return (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFx.playClick(1000)}
                className="glass-panel hover:bg-slate-900/90 p-3.5 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all group flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-white/5 border ${res.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-300 transition" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-heading group-hover:text-cyan-300 transition truncate">
                    {res.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{res.desc}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Starred Projects & Live Health Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Starred Core Projects */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-heading flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 text-cyan-400" />
              <span>Priority Starred Services</span>
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              All Projects ({projects.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {starredProjects.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition"
              >
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-xs font-heading">{p.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.tagline}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="font-mono text-[10px] text-emerald-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    {p.latency ? `${p.latency}ms` : 'UP'}
                  </div>
                  {p.links[0]?.url && (
                    <a
                      href={p.links[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subdomain 000 Instructions & Hosts Setup Guide */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-4 bg-cyan-950/10">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white font-heading">
              Subdomain Gateway Binding (000.*)
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The mission control dashboard is natively configured to listen on all hostnames and subdomains with zero port collision.
          </p>

          <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-white/10 font-mono text-[11px]">
            <div className="text-slate-400 flex items-center justify-between">
              <span>RFC 6761 Auto-Resolved Subdomain:</span>
              <span className="text-cyan-300 font-bold">000.localhost:3000</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>Local Network Host Binding:</span>
              <span className="text-purple-300">0.0.0.0:3000</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-400 flex items-center space-x-2 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Open <a href="http://000.localhost:3000" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">http://000.localhost:3000</a> directly in Chrome or Edge!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
