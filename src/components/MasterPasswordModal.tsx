import React, { useState } from 'react';
import { Shield, Key, Lock, Unlock, X, AlertCircle, Sparkles } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => boolean;
  isFirstSetup?: boolean;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  isFirstSetup = false
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    const success = onUnlock(password);
    if (success) {
      soundFx.playUnlock();
      setPassword('');
      setError('');
      onClose();
    } else {
      soundFx.playAlarm();
      setError('Invalid master passphrase. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0d121f] border border-amber-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(255,183,3,0.15)] space-y-4 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">
              {isFirstSetup ? 'Initialize Vault Master Key' : 'Unlock Zero-Knowledge Vault'}
            </h3>
            <p className="text-xs text-slate-400">
              Enter master passphrase for client-side AES-GCM 256 decryption.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Master Passphrase
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="hhm* (Moscow time, e.g. 023*)"
              className="w-full px-3 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Dynamic Key: <span className="text-amber-400">hhm*</span> (MSK Time)</span>
            <span className="text-cyan-400">PBKDF2 / AES-256</span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg transition"
            >
              Unlock Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
