import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ExternalLink, 
  Key, 
  Box, 
  Activity, 
  Terminal, 
  FolderGit2, 
  X,
  Copy,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ProjectItem, SecretItem, ArtifactItem, HealthEndpoint, QuickAction, ActiveTab } from '../types';
import { soundFx } from '../services/soundFx';

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  secrets: SecretItem[];
  artifacts: ArtifactItem[];
  healthEndpoints: HealthEndpoint[];
  quickActions: QuickAction[];
  isVaultUnlocked: boolean;
  onNavigate: (tab: ActiveTab) => void;
  onExecuteAction: (action: QuickAction) => void;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({
  isOpen,
  onClose,
  projects,
  secrets,
  artifacts,
  healthEndpoints,
  quickActions,
  isVaultUnlocked,
  onNavigate,
  onExecuteAction
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProjects = projects.filter(p => 
    !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
  ).map(p => ({
    type: 'project' as const,
    id: p.id,
    title: p.name,
    subtitle: p.tagline,
    badge: p.category,
    icon: FolderGit2,
    badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30',
    primaryLink: p.links[0]?.url,
    item: p
  }));

  const filteredSecrets = secrets.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.service.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  ).map(s => ({
    type: 'secret' as const,
    id: s.id,
    title: s.name,
    subtitle: `${s.service} • ${s.category}`,
    badge: s.category,
    icon: Key,
    badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
    item: s
  }));

  const filteredArtifacts = artifacts.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.version.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  ).map(a => ({
    type: 'artifact' as const,
    id: a.id,
    title: a.name,
    subtitle: `v${a.version} • ${a.size} • ${a.category}`,
    badge: a.version,
    icon: Box,
    badgeColor: 'bg-purple-950/80 text-purple-400 border-purple-500/30',
    item: a
  }));

  const filteredActions = quickActions.filter(a =>
    !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  ).map(a => ({
    type: 'action' as const,
    id: a.id,
    title: a.title,
    subtitle: a.description,
    badge: a.category,
    icon: Zap,
    badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
    item: a
  }));

  const allResults = [
    ...filteredProjects,
    ...filteredSecrets,
    ...filteredArtifacts,
    ...filteredActions
  ].slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allResults.length || 1));
      soundFx.playClick(650);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % (allResults.length || 1));
      soundFx.playClick(750);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allResults[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    }
  };

  const handleSelect = (item: typeof allResults[0]) => {
    soundFx.playClick(1000);
    if (item.type === 'project') {
      if (item.primaryLink) window.open(item.primaryLink, '_blank');
      else onNavigate('projects');
    } else if (item.type === 'secret') {
      onNavigate('vault');
    } else if (item.type === 'artifact') {
      onNavigate('artifacts');
    } else if (item.type === 'action') {
      onExecuteAction(item.item as QuickAction);
    }
    onClose();
  };

  const handleCopySecret = (e: React.MouseEvent, secret: SecretItem) => {
    e.stopPropagation();
    if (!isVaultUnlocked) {
      alert('Unlock vault first to copy decrypted secret!');
      return;
    }
    navigator.clipboard.writeText(secret.value);
    soundFx.playCopy();
    setCopiedId(secret.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl bg-[#0d121f] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, keys, artifacts, actions, or URLs... (Press Esc to close)"
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-mono">
              No matching records found for "{query}"
            </div>
          ) : (
            allResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,242,254,0.15)]' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-white truncate font-heading">{item.title}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {item.type === 'secret' && (
                      <button
                        onClick={(e) => handleCopySecret(e, item.item as SecretItem)}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 text-xs font-mono flex items-center space-x-1"
                        title="Copy Secret"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    )}
                    {item.type === 'project' && item.primaryLink && (
                      <span className="text-xs text-cyan-400 flex items-center font-mono space-x-1">
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center space-x-3">
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Enter</kbd> Select</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Esc</kbd> Close</span>
          </div>
          <span className="text-cyan-400/80">000 Quick Command</span>
        </div>
      </div>
    </div>
  );
};
