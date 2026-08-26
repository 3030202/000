import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Search, 
  Radio, 
  Activity, 
  Terminal, 
  ExternalLink,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { soundFx } from '../services/soundFx';
import { DefconLevel, ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isVaultUnlocked: boolean;
  onUnlockVault: () => void;
  onLockVault: () => void;
  defcon: DefconLevel;
  setDefcon: (level: DefconLevel) => void;
  onOpenSpotlight: () => void;
  totalProjects: number;
  totalSecrets: number;
  totalArtifacts: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isVaultUnlocked,
  onUnlockVault,
  onLockVault,
  defcon,
  setDefcon,
  onOpenSpotlight,
  totalProjects,
  totalSecrets,
  totalArtifacts
}) => {
  const [time, setTime] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(soundFx.enabled);
  const [copiedSubdomain, setCopiedSubdomain] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    soundFx.enabled = !soundFx.enabled;
    setSoundOn(soundFx.enabled);
    if (soundFx.enabled) soundFx.playClick(1000);
  };

  const handleCopySubdomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('http://000.localhost:3000');
    soundFx.playCopy();
    setCopiedSubdomain(true);
    setTimeout(() => setCopiedSubdomain(false), 2000);
  };

  const handleTabChange = (tab: ActiveTab) => {
    soundFx.playClick(900);
    setActiveTab(tab);
  };

  const getDefconBadge = () => {
    switch (defcon) {
      case 1: return { label: 'DEFCON 1 • MAXIMUM LOCKDOWN', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/50' };
      case 2: return { label: 'DEFCON 2 • HIGH ALERT', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
      case 3: return { label: 'DEFCON 3 • ELEVATED', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
      case 4: return { label: 'DEFCON 4 • GUARDED', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/50' };
      default: return { label: 'DEFCON 5 • NOMINAL', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
  };

  const defconInfo = getDefconBadge();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#080b12]/80 backdrop-blur-xl transition-all">
      {/* Top Banner / System Telemetry bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-white/5 text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-mono">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${defcon === 1 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${defcon === 1 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-slate-300 font-semibold tracking-wider">GATEWAY: ACTIVE</span>
          </div>

          <div 
            onClick={handleCopySubdomain}
            className="flex items-center space-x-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded cursor-pointer transition-all font-mono group"
            title="Click to copy 000 subdomain URL"
          >
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="font-bold">000.localhost:3000</span>
            {copiedSubdomain ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-cyan-400/60 group-hover:text-cyan-300" />
            )}
          </div>
        </div>

        {/* DEFCON Level Selector & Clock */}
        <div className="flex items-center space-x-3">
          {/* DEFCON Switcher */}
          <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded border border-white/10">
            <span className="text-[10px] text-slate-500 font-mono px-1">DEFCON:</span>
            {([5, 4, 3, 2, 1] as DefconLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  soundFx.playClick(600 + level * 80);
                  if (level === 1) soundFx.playAlarm();
                  setDefcon(level);
                }}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition-all ${
                  defcon === level 
                    ? level === 1 ? 'bg-rose-600 text-white' : level === 2 ? 'bg-orange-500 text-white' : 'bg-cyan-500 text-black' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className={`px-2 py-0.5 rounded border font-mono text-[11px] font-medium ${defconInfo.bg}`}>
            {defconInfo.label}
          </div>

          <div className="hidden md:block font-mono text-slate-400 text-[11px]">
            {time}
          </div>

          {/* Sound Mute/Unmute */}
          <button 
            onClick={toggleSound}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={soundOn ? 'Audio SFX Enabled' : 'Audio SFX Muted'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabChange('overview')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
            <span className="font-mono font-black text-cyan-300 text-lg tracking-tighter">000</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight font-heading">MISSION CONTROL</h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v2.6
              </span>
            </div>
            <p className="text-[11px] text-slate-400">All-in-One Operations Deck, Vault & Infra Hub</p>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('projects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'projects'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>Projects</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {totalProjects}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('vault')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'vault'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(255,183,3,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Vault & Secrets</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/60 text-amber-300 font-mono border border-amber-500/30">
              {totalSecrets}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('artifacts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'artifacts'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(157,78,221,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>Artifacts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950/60 text-purple-300 font-mono border border-purple-500/30">
              {totalArtifacts}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('monitoring')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'monitoring'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,245,160,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Health</span>
          </button>
          <button
            onClick={() => handleTabChange('topology')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'topology'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>Cyber Topology</span>
          </button>
          <button
            onClick={() => handleTabChange('ops')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'ops'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>CLI Ops</span>
          </button>
        </nav>

        {/* Right Actions: Spotlight Search & Vault Master Lock */}
        <div className="flex items-center space-x-2.5">
          {/* Spotlight Search button */}
          <button
            onClick={onOpenSpotlight}
            className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 border border-white/15 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition shadow-sm group"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
            <span className="text-xs font-medium hidden sm:inline">Search...</span>
            <kbd className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/10">
              Ctrl+K
            </kbd>
          </button>

          {/* Master Vault Lock Button */}
          {isVaultUnlocked ? (
            <button
              onClick={onLockVault}
              className="flex items-center space-x-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition shadow-[0_0_12px_rgba(255,183,3,0.2)]"
              title="Vault is UNLOCKED. Click to Lock"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">VAULT: UNLOCKED</span>
            </button>
          ) : (
            <button
              onClick={onUnlockVault}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition"
              title="Click to Unlock Zero-Knowledge Vault"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">VAULT: LOCKED</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
