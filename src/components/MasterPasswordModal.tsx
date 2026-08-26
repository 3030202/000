import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle, ShieldAlert } from 'lucide-react';
import { soundFx } from '../services/soundFx';
import { UnlockResult, useVault } from '../context/VaultContext';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => UnlockResult;
  isFirstSetup?: boolean;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  isFirstSetup = false
}) => {
  const { bannedUntil } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Live countdown timer for 15-minute ban
  useEffect(() => {
    const updateCountdown = () => {
      const storedBan = Number(localStorage.getItem('000_vault_banned_until') || '0');
      const activeBan = bannedUntil || (storedBan > Date.now() ? storedBan : null);

      if (activeBan && activeBan > Date.now()) {
        const secs = Math.ceil((activeBan - Date.now()) / 1000);
        setRemainingSeconds(secs);
      } else {
        setRemainingSeconds(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [bannedUntil]);

  if (!isOpen) return null;

  const isBanned = remainingSeconds > 0;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned || !password) return;

    const res = onUnlock(password);
    if (res.success) {
      soundFx.playUnlock();
      setPassword('');
      setError('');
      onClose();
    } else {
      soundFx.playAlarm();
      if (res.error === 'BANNED' || (res.bannedUntil && res.bannedUntil > Date.now())) {
        setError(`⛔ Доступ заблокирован на 15 минут из-за 2 неверных попыток.`);
      } else if (res.attemptsLeft !== undefined) {
        setError(`⚠️ Неверный мастер-пароль! Осталась ${res.attemptsLeft} попытка до блокировки на 15 минут.`);
      } else {
        setError('Неверный мастер-пароль. Доступ отклонен.');
      }
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
          <div className={`p-3 rounded-2xl ${isBanned ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
            {isBanned ? <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">
              {isBanned
                ? 'Security Lockout Active'
                : isFirstSetup
                ? 'Initialize Vault Master Key'
                : 'Zero-Knowledge Vault Gateway'}
            </h3>
            <p className="text-xs text-slate-400">
              {isBanned
                ? 'Too many failed passphrase attempts. System temporarily locked.'
                : 'Enter master passphrase for client-side AES-GCM 256 decryption.'}
            </p>
          </div>
        </div>

        {isBanned && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 font-mono space-y-1">
            <div className="flex items-center space-x-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>ACCESS SUSPENDED (2 FAILED ATTEMPTS)</span>
            </div>
            <div className="text-sm font-bold text-rose-300 pt-1">
              Lockout Countdown: <span className="text-white bg-rose-900/60 px-2 py-0.5 rounded">{formatTime(remainingSeconds)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Master Passphrase
            </label>
            <input
              type="password"
              autoFocus
              required
              disabled={isBanned}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={isBanned ? 'Access Locked...' : '••••••••'}
              className="w-full px-3 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {!isBanned && error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>PBKDF2 100k rounds</span>
            <span className="text-amber-400">Zero-Knowledge</span>
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
              disabled={isBanned}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 text-black shadow-lg transition"
            >
              {isBanned ? `Locked (${formatTime(remainingSeconds)})` : 'Unlock Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
