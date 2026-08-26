import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Terminal, 
  AlertTriangle,
  FileKey,
  Database,
  Sparkles,
  QrCode,
  X
} from 'lucide-react';
import { SecretItem, SecretCategory, Environment } from '../types';
import { soundFx } from '../services/soundFx';
import { generateMatrixScramble } from '../services/crypto';

interface SecretsVaultProps {
  secrets: SecretItem[];
  isUnlocked: boolean;
  onUnlockRequest: () => void;
  onLockVault: () => void;
  onAddSecret: (secret: SecretItem) => void;
  onExportVault: () => void;
  onImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SecretsVault: React.FC<SecretsVaultProps> = ({
  secrets,
  isUnlocked,
  onUnlockRequest,
  onLockVault,
  onAddSecret,
  onExportVault,
  onImportVault
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [animatingIds, setAnimatingIds] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [qrModalSecret, setQrModalSecret] = useState<SecretItem | null>(null);

  // New Secret form state
  const [newSecret, setNewSecret] = useState<Partial<SecretItem>>({
    name: '',
    category: 'API Key',
    value: '',
    service: '',
    env: 'production',
    description: '',
    tags: []
  });
  const [newTagsInput, setNewTagsInput] = useState('');

  // Built-in Key Generator state
  const [generatedLength, setGeneratedLength] = useState<number>(32);
  const [generatedType, setGeneratedType] = useState<'hex' | 'base64' | 'alphanumeric'>('alphanumeric');

  const categories: (SecretCategory | 'all')[] = [
    'all',
    'API Key',
    'Cloud Credentials',
    'Database Connection',
    'SSH / RSA Key',
    'Webhook Secret',
    'OAuth / Token'
  ];

  // Matrix Scramble Reveal Animation
  const handleToggleReveal = (id: string, realValue: string) => {
    if (!isUnlocked) {
      onUnlockRequest();
      return;
    }

    if (revealedIds[id]) {
      soundFx.playClick(600);
      setRevealedIds(prev => ({ ...prev, [id]: false }));
      setAnimatingIds(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    soundFx.playUnlock();
    setRevealedIds(prev => ({ ...prev, [id]: true }));

    // Run scramble animation for 400ms
    let frames = 0;
    const interval = setInterval(() => {
      frames++;
      setAnimatingIds(prev => ({
        ...prev,
        [id]: generateMatrixScramble(Math.min(realValue.length, 24))
      }));

      if (frames > 6) {
        clearInterval(interval);
        setAnimatingIds(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    }, 60);
  };

  const handleCopy = (id: string, val: string) => {
    if (!isUnlocked) {
      onUnlockRequest();
      return;
    }
    navigator.clipboard.writeText(val);
    soundFx.playCopy();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGenerateKey = () => {
    soundFx.playClick(1200);
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    const hexChars = '0123456789abcdef';
    
    if (generatedType === 'hex') {
      for (let i = 0; i < generatedLength; i++) result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    } else if (generatedType === 'base64') {
      const bytes = new Uint8Array(Math.floor(generatedLength * 0.75));
      crypto.getRandomValues(bytes);
      result = btoa(String.fromCharCode(...bytes)).substring(0, generatedLength);
    } else {
      for (let i = 0; i < generatedLength; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setNewSecret(prev => ({ ...prev, value: result }));
  };

  const handleSaveSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecret.name || !newSecret.value) return;

    const tags = newTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const item: SecretItem = {
      id: `sec-${Date.now()}`,
      name: newSecret.name.toUpperCase().replace(/\s+/g, '_'),
      category: (newSecret.category as SecretCategory) || 'API Key',
      value: newSecret.value,
      service: newSecret.service || 'Internal System',
      env: (newSecret.env as Environment) || 'production',
      tags: tags.length ? tags : ['Vault'],
      description: newSecret.description || 'Stored securely in Zero-Knowledge Vault'
    };

    soundFx.playDeploySuccess();
    onAddSecret(item);
    setIsAddModalOpen(false);
    setNewSecret({
      name: '',
      category: 'API Key',
      value: '',
      service: '',
      env: 'production',
      description: '',
      tags: []
    });
    setNewTagsInput('');
  };

  const filteredSecrets = secrets.filter(s => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.service.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Vault Status & Actions Banner */}
      <div className={`glass-panel p-5 rounded-2xl border transition-all ${
        isUnlocked ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3.5 rounded-2xl border ${
              isUnlocked 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(255,183,3,0.3)]' 
                : 'bg-slate-800/80 text-slate-400 border-white/10'
            }`}>
              {isUnlocked ? <Unlock className="w-6 h-6 animate-pulse" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white font-heading">
                  ZERO-KNOWLEDGE SECRETS VAULT
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  AES-GCM 256
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUnlocked 
                  ? 'Vault is currently decrypted in session memory. Auto-locks upon tab inactivity.'
                  : 'All credentials and API tokens are encrypted client-side with PBKDF2 derived keys.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isUnlocked ? (
              <button
                onClick={onLockVault}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Vault</span>
              </button>
            ) : (
              <button
                onClick={onUnlockRequest}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono transition shadow-[0_0_15px_rgba(255,183,3,0.35)]"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Master Key</span>
              </button>
            )}

            <button
              onClick={() => {
                soundFx.playClick(900);
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Secret</span>
            </button>

            <button
              onClick={onExportVault}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono transition"
              title="Export Encrypted JSON Backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <label className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={onImportVault} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Filter & Category Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                soundFx.playClick(800);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Credentials' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter secrets by name or service..."
          className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono w-full md:w-64"
        />
      </div>

      {/* Secrets List Cards */}
      <div className="space-y-3">
        {filteredSecrets.map((secret) => {
          const isRevealed = revealedIds[secret.id];
          const isAnimating = animatingIds[secret.id];
          const displayValue = !isUnlocked
            ? '••••••••••••••••••••••••••••••••'
            : isAnimating
            ? animatingIds[secret.id]
            : isRevealed
            ? secret.value
            : '••••••••••••••••••••••••••••••••';

          return (
            <div
              key={secret.id}
              className="group glass-panel hover:bg-slate-900/80 p-4 rounded-xl border border-white/10 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white group-hover:text-amber-300 transition">
                    {secret.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {secret.category}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {secret.service}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{secret.description}</p>

                {/* Secret Value Strip */}
                <div className="flex items-center space-x-2 pt-1">
                  <div className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 font-mono text-xs text-amber-200 select-all overflow-x-auto max-w-xl">
                    {displayValue}
                  </div>
                  {secret.expiresAt && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Exp: {secret.expiresAt}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleToggleReveal(secret.id, secret.value)}
                  className={`p-2 rounded-lg border text-xs font-mono transition ${
                    isRevealed
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
                  }`}
                  title={isRevealed ? 'Mask value' : 'Matrix Scramble & Reveal'}
                >
                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleCopy(secret.id, secret.value)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-semibold transition"
                  title="Copy secret value"
                >
                  {copiedId === secret.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setQrModalSecret(secret)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 border border-white/10 text-xs transition"
                  title="Show QR Code for Mobile"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Secret Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0d121f] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white font-heading flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Add Credential to Encrypted Vault</span>
            </h2>

            <form onSubmit={handleSaveSecret} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Secret Key Name *</label>
                <input
                  type="text"
                  required
                  value={newSecret.name}
                  onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value })}
                  placeholder="e.g. AWS_SECRET_ACCESS_KEY"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Category</label>
                  <select
                    value={newSecret.category}
                    onChange={(e) => setNewSecret({ ...newSecret, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {categories.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Target Service</label>
                  <input
                    type="text"
                    value={newSecret.service}
                    onChange={(e) => setNewSecret({ ...newSecret, service: e.target.value })}
                    placeholder="e.g. Cloudflare / OpenAI"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Secret Value & Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-400">Secret Value *</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleGenerateKey}
                      className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Random</span>
                    </button>
                  </div>
                </div>
                <textarea
                  required
                  rows={3}
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  placeholder="Paste raw token, private key or database URL..."
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={newSecret.description}
                  onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                  placeholder="e.g. Tier-1 access key for production worker"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal for Mobile Transfer */}
      {qrModalSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#0d121f] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setQrModalSecret(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white font-heading">
              Secure QR Transfer
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate">
              {qrModalSecret.name}
            </p>

            <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner mx-auto w-48 h-48 items-center">
              {/* Synthetic Canvas QR representation */}
              <div className="font-mono text-[9px] text-black leading-none break-all select-none">
                ■■■■■■■ █ █ ■■■■■■■<br/>
                ■ █ █ ■ █ █ ■ █ █ ■<br/>
                ■■■■■■■ █ █ ■■■■■■■<br/>
                ███████████████████<br/>
                ■ █ ■ █ ■ █ ■ █ ■ █<br/>
                ■■■■■■■ █ █ ■■■■■■■<br/>
                [SECURE_QR_TOKEN]
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Scan with your mobile terminal to copy token securely.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
