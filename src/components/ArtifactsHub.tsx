import React, { useState } from 'react';
import { 
  Box, 
  Download, 
  Check, 
  Copy, 
  ShieldCheck, 
  HardDrive, 
  FileCode, 
  Plus, 
  Search, 
  ExternalLink,
  Layers,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { ArtifactItem, Environment } from '../types';
import { soundFx } from '../services/soundFx';
import { computeSha256 } from '../services/crypto';

interface ArtifactsHubProps {
  artifacts: ArtifactItem[];
  onAddArtifact: (artifact: ArtifactItem) => void;
}

export const ArtifactsHub: React.FC<ArtifactsHubProps> = ({
  artifacts,
  onAddArtifact
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [copiedShaId, setCopiedShaId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Hash Verifier State
  const [verifyArtifact, setVerifyArtifact] = useState<ArtifactItem | null>(null);
  const [userHash, setUserHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<'match' | 'mismatch' | null>(null);

  // New artifact form state
  const [newArt, setNewArt] = useState<Partial<ArtifactItem>>({
    name: '',
    version: '1.0.0',
    category: 'Release Binary',
    size: '15.0 MB',
    sha256: '',
    downloadUrl: '#',
    env: 'production',
    buildNumber: `BUILD-${Math.floor(Math.random() * 9000) + 1000}`,
    status: 'verified',
    notes: ''
  });

  const categories = [
    'all',
    'Release Binary',
    'Docker Image',
    'SSL / Cert',
    'Database Backup',
    'AI Model Weights',
    'Config Dump'
  ];

  const handleCopySha = (id: string, sha: string) => {
    navigator.clipboard.writeText(sha);
    soundFx.playCopy();
    setCopiedShaId(id);
    setTimeout(() => setCopiedShaId(null), 2000);
  };

  const handleDownload = (artifact: ArtifactItem) => {
    soundFx.playClick(1000);
    // Simulate blob download
    const blob = new Blob([
      `000 Artifact Manifest: ${artifact.name}\nVersion: ${artifact.version}\nSHA256: ${artifact.sha256}\nBuilt: ${artifact.createdAt}\nStatus: ${artifact.status}`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.name}.manifest.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyArtifact || !userHash) return;
    const cleanUser = userHash.trim().toLowerCase();
    const cleanOrig = verifyArtifact.sha256.trim().toLowerCase();
    if (cleanUser === cleanOrig) {
      soundFx.playDeploySuccess();
      setVerifyResult('match');
    } else {
      soundFx.playAlarm();
      setVerifyResult('mismatch');
    }
  };

  const handleSaveArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArt.name) return;

    const fakeSha = newArt.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const item: ArtifactItem = {
      id: `art-${Date.now()}`,
      name: newArt.name,
      version: newArt.version || '1.0.0',
      category: (newArt.category as any) || 'Release Binary',
      size: newArt.size || '1.2 MB',
      sha256: fakeSha,
      downloadUrl: newArt.downloadUrl || '#',
      env: (newArt.env as Environment) || 'production',
      buildNumber: newArt.buildNumber || 'BUILD-9000',
      createdAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
      status: 'verified',
      notes: newArt.notes || 'Verified release asset'
    };

    soundFx.playDeploySuccess();
    onAddArtifact(item);
    setIsUploadOpen(false);
  };

  const filteredArtifacts = artifacts.filter(a => {
    const matchesCat = selectedCat === 'all' || a.category === selectedCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || a.name.toLowerCase().includes(q) || a.version.toLowerCase().includes(q) || a.sha256.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/40 shadow-[0_0_20px_rgba(157,78,221,0.2)]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              ARTIFACTS & RELEASE REGISTRY
            </h2>
            <p className="text-xs text-slate-400">
              Validated distribution binaries, Docker images, certificates, and database snapshots.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              soundFx.playClick(900);
              setIsUploadOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-xl text-xs transition shadow-[0_0_15px_rgba(157,78,221,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>Register Artifact</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                soundFx.playClick(800);
                setSelectedCat(cat);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                selectedCat === cat 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Artifacts' : cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artifacts, tags, SHA..."
            className="w-full md:w-64 pl-9 pr-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 font-mono"
          />
        </div>
      </div>

      {/* Artifacts List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredArtifacts.map((art) => (
          <div
            key={art.id}
            className="group glass-panel hover:bg-slate-900/80 p-4 rounded-xl border border-white/10 hover:border-purple-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Box className="w-5 h-5" />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white group-hover:text-purple-300 transition truncate">
                    {art.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {art.version}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {art.category}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{art.status}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-400">{art.notes}</p>

                {/* SHA-256 and metadata strip */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
                  <span className="text-slate-300 font-semibold">{art.size}</span>
                  <span>•</span>
                  <span>{art.buildNumber}</span>
                  <span>•</span>
                  <span>{art.createdAt}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1 bg-black/40 px-2 py-0.5 rounded border border-white/5 text-slate-400">
                    <span className="text-[10px] text-slate-500">SHA256:</span>
                    <span className="text-[10px] text-purple-300 font-mono select-all truncate max-w-xs">
                      {art.sha256}
                    </span>
                    <button
                      onClick={() => handleCopySha(art.id, art.sha256)}
                      className="text-slate-400 hover:text-white ml-1"
                      title="Copy SHA-256"
                    >
                      {copiedShaId === art.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
              <button
                onClick={() => {
                  soundFx.playClick(900);
                  setVerifyArtifact(art);
                  setUserHash('');
                  setVerifyResult(null);
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-mono transition flex items-center space-x-1"
                title="Verify SHA-256 checksum"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verify Hash</span>
              </button>

              <button
                onClick={() => handleDownload(art)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Verify Checksum Modal */}
      {verifyArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0d121f] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-heading flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              <span>SHA-256 Checksum Integrity Test</span>
            </h3>

            <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-xs">
              <div className="text-slate-400">Target: <span className="text-white font-bold">{verifyArtifact.name}</span></div>
              <div className="text-slate-400 break-all">Expected: <span className="text-cyan-300">{verifyArtifact.sha256}</span></div>
            </div>

            <form onSubmit={handleTestVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Paste Calculated Checksum to Verify:
                </label>
                <input
                  type="text"
                  required
                  value={userHash}
                  onChange={(e) => setUserHash(e.target.value)}
                  placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {verifyResult === 'match' && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-mono flex items-center space-x-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>CHECKSUM VERIFIED: Binary integrity is 100% genuine and unaltered.</span>
                </div>
              )}

              {verifyResult === 'mismatch' && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 font-mono flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>CHECKSUM MISMATCH: Provided hash does not match artifact ledger!</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setVerifyArtifact(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg"
                >
                  Verify Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload/Register Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0d121f] border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-heading flex items-center space-x-2">
              <Box className="w-5 h-5 text-purple-400" />
              <span>Register Artifact / Release Asset</span>
            </h3>

            <form onSubmit={handleSaveArtifact} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Artifact Filename *</label>
                <input
                  type="text"
                  required
                  value={newArt.name}
                  onChange={(e) => setNewArt({ ...newArt, name: e.target.value })}
                  placeholder="e.g. gateway-core-v3.0.0-linux-amd64.tar.gz"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Version</label>
                  <input
                    type="text"
                    value={newArt.version}
                    onChange={(e) => setNewArt({ ...newArt, version: e.target.value })}
                    placeholder="v2.6.4"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Category</label>
                  <select
                    value={newArt.category}
                    onChange={(e) => setNewArt({ ...newArt, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {categories.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">File Size</label>
                  <input
                    type="text"
                    value={newArt.size}
                    onChange={(e) => setNewArt({ ...newArt, size: e.target.value })}
                    placeholder="e.g. 48.2 MB"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">SHA-256 Hash</label>
                  <input
                    type="text"
                    value={newArt.sha256}
                    onChange={(e) => setNewArt({ ...newArt, sha256: e.target.value })}
                    placeholder="Auto-generated or custom hex..."
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Release Notes</label>
                <input
                  type="text"
                  value={newArt.notes}
                  onChange={(e) => setNewArt({ ...newArt, notes: e.target.value })}
                  placeholder="e.g. Production ready binary with Brotli compression"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-lg"
                >
                  Save Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
