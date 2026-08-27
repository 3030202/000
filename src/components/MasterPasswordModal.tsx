import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, KeyRound, Timer, ShieldCheck, AlertTriangle } from 'lucide-react';
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
  const { isVaultUnlocked, bannedUntil, recordTimeoutFailure } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [banRemainingSecs, setBanRemainingSecs] = useState<number>(0);
  const [timeoutMs, setTimeoutMs] = useState<number>(15000); // 15.0s timeout

  const inputRef = useRef<HTMLInputElement>(null);
  const isBanned = banRemainingSecs > 0;

  // 1. Live 15-Minute Ban Countdown
  useEffect(() => {
    const updateBan = () => {
      const storedBan = Number(localStorage.getItem('000_vault_banned_until') || '0');
      const activeBan = bannedUntil || (storedBan > Date.now() ? storedBan : null);

      if (activeBan && activeBan > Date.now()) {
        const secs = Math.ceil((activeBan - Date.now()) / 1000);
        setBanRemainingSecs(secs);
      } else {
        setBanRemainingSecs(0);
      }
    };

    updateBan();
    const interval = setInterval(updateBan, 1000);
    return () => clearInterval(interval);
  }, [bannedUntil]);

  // 2. 15-Second Entry Timeout Timer (resets on input or attempt)
  useEffect(() => {
    if (!isOpen || isVaultUnlocked || isBanned) {
      setTimeoutMs(15000);
      return;
    }

    const startTimestamp = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const left = Math.max(0, 15000 - elapsed);
      setTimeoutMs(left);

      if (left <= 0) {
        clearInterval(interval);
        // Timeout expired: count as 1 failed attempt
        soundFx.playAlarm();
        const res = recordTimeoutFailure();
        if (res.error === 'BANNED' || (res.bannedUntil && res.bannedUntil > Date.now())) {
          setError('⛔ Время вышло (15с)! Сработала блокировка на 15 минут из-за 2 ошибок.');
        } else {
          setError('⚠️ Время вышло (15с)! Зафиксирована 1 ошибка. Осталась 1 попытка.');
          setTimeoutMs(15000); // Reset timer for second attempt
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isVaultUnlocked, isBanned, recordTimeoutFailure]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isBanned) {
      inputRef.current?.focus();
    }
  }, [isOpen, isBanned]);

  if (!isOpen && isVaultUnlocked) return null;

  const formatBanTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeoutSeconds = (timeoutMs / 1000).toFixed(1);
  const timeoutPercent = Math.max(0, Math.min(100, (timeoutMs / 15000) * 100));

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
      setPassword('');
      setTimeoutMs(15000); // Reset 15s timer for the next attempt
      if (res.error === 'BANNED' || (res.bannedUntil && res.bannedUntil > Date.now())) {
        setError('⛔ Доступ заблокирован на 15 минут из-за 2 неверных попыток.');
      } else if (res.attemptsLeft !== undefined) {
        setError(`⚠️ Неверный мастер-пароль! Осталась ${res.attemptsLeft} попытка до блокировки на 15 минут.`);
      } else {
        setError('Неверный мастер-пароль. Доступ отклонен.');
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(2, 4, 8, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      {/* Heavy Cyber Armored Safe Card */}
      <div
        className="vault-safe-door"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          border: isBanned ? '2px solid rgba(248, 113, 113, 0.8)' : '2px solid rgba(56, 189, 248, 0.5)',
          boxShadow: isBanned
            ? '0 0 60px rgba(248, 113, 113, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.9)'
            : '0 0 60px rgba(56, 189, 248, 0.25), inset 0 0 30px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Safe Header & Dial Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: isBanned
                ? 'radial-gradient(circle, #450a0a 0%, #1f0404 100%)'
                : 'radial-gradient(circle, #0c2340 0%, #061120 100%)',
              border: isBanned ? '2px solid var(--red)' : '2px solid var(--cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isBanned ? '0 0 15px rgba(248, 113, 113, 0.5)' : '0 0 15px rgba(56, 189, 248, 0.4)'
            }}
          >
            {/* Rotating dial ring */}
            <div
              className={!isBanned ? 'safe-dial-spinner' : ''}
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1px dashed ' + (isBanned ? 'var(--red)' : 'var(--cyan)'),
                opacity: 0.6
              }}
            />
            {isBanned ? (
              <ShieldAlert style={{ width: '24px', height: '24px', color: 'var(--red)' }} />
            ) : (
              <Lock style={{ width: '24px', height: '24px', color: 'var(--cyan)' }} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                {isBanned ? 'SECURITY LOCKOUT ACTIVE' : '000 CYBER SAFE GATE'}
              </span>
              <span className={`pill ${isBanned ? 'red' : 'green'}`} style={{ fontSize: '8px' }}>
                {isBanned ? '● SHUTDOWN' : '● ARMORED'}
              </span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--fg-dim)', margin: '3px 0 0 0', lineHeight: '1.3' }}>
              {isBanned
                ? 'Exceeded maximum allowable failed attempts. Access denied.'
                : 'Zero-Knowledge AES-GCM 256 master gateway authentication.'}
            </p>
          </div>
        </div>

        {/* 15-Minute Ban Alert Box */}
        {isBanned ? (
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(69, 10, 10, 0.85)',
              border: '1px solid rgba(248, 113, 113, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', fontSize: '11px', fontWeight: 'bold' }}>
              <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>ACCESS SUSPENDED (2 FAILED ATTEMPTS)</span>
            </div>
            <div style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>
              Lockout Ban Countdown: <strong style={{ color: 'var(--yellow)', fontSize: '14px', background: '#000', padding: '2px 8px', borderRadius: '4px' }}>{formatBanTime(banRemainingSecs)}</strong>
            </div>
          </div>
        ) : (
          /* 15-Second Session Progress Bar */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--fg-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Timer style={{ width: '12px', height: '12px', color: timeoutMs < 4000 ? 'var(--red)' : 'var(--yellow)' }} />
                SESSION ENTRY TIMEOUT:
              </span>
              <span
                style={{
                  fontWeight: 'bold',
                  color: timeoutMs < 4000 ? 'var(--red)' : timeoutMs < 8000 ? 'var(--yellow)' : 'var(--cyan)'
                }}
              >
                {timeoutSeconds}s REMAINING
              </span>
            </div>

            {/* Progress track */}
            <div
              style={{
                width: '100%',
                height: '5px',
                background: '#04070e',
                borderRadius: '3px',
                border: '1px solid var(--border)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${timeoutPercent}%`,
                  height: '100%',
                  background: timeoutMs < 4000
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : timeoutMs < 8000
                    ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                    : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                  transition: 'width 0.1s linear'
                }}
              />
            </div>
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--fg-muted)' }}>
                MASTER PASSPHRASE
              </label>
              <span style={{ fontSize: '8.5px', color: 'var(--fg-dim)' }}>
                {isBanned ? '0 ATTEMPTS LEFT' : 'MAX 2 ATTEMPTS (15 MIN BAN)'}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="password"
                required
                disabled={isBanned}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={isBanned ? 'System Locked...' : '••••••••'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#040710',
                  border: isBanned ? '1px solid #7f1d1d' : '1px solid var(--border-focus)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  letterSpacing: '3px',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
                }}
              />
            </div>
          </div>

          {/* Error / Warning Alert */}
          {!isBanned && error && (
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(69, 10, 10, 0.7)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                borderRadius: '8px',
                color: 'var(--red)',
                fontSize: '9.5px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Security Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--fg-muted)', fontFamily: 'monospace' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldCheck style={{ width: '10px', height: '10px', color: 'var(--cyan)' }} />
              PBKDF2 100K • AES-256
            </span>
            <span style={{ color: 'var(--cyan)' }}>Zero-Knowledge Core</span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isBanned}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '8px',
              background: isBanned ? '#1e293b' : undefined,
              color: isBanned ? '#64748b' : undefined,
              cursor: isBanned ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isBanned ? (
              <span>⛔ LOCKED ({formatBanTime(banRemainingSecs)})</span>
            ) : (
              <>
                <KeyRound style={{ width: '14px', height: '14px' }} />
                <span>UNLOCK MISSION CONTROL SAFE</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
