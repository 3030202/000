import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundFx } from '../services/soundFx';
import { generateMatrixScramble } from '../services/crypto';
import { useDashboard } from './DashboardContext';
import { recordAuthEvent } from '../services/authAuditLog';

export interface UnlockResult {
  success: boolean;
  error?: string;
  bannedUntil?: number;
  attemptsLeft?: number;
  mode?: 'PAPA_IS_HOME' | 'ADMIN' | 'STANDARD';
}

export interface VaultContextType {
  isVaultUnlocked: boolean;
  setIsVaultUnlocked: (unlocked: boolean) => void;
  revealedSecrets: Record<string, boolean>;
  animatingSecrets: Record<string, string>;
  copiedKeyId: string | null;
  bannedUntil: number | null;
  failedAttempts: number;
  sessionExpiresAt: number | null;
  sessionRemainingSecs: number;
  sessionMode: 'PAPA_IS_HOME' | 'ADMIN' | 'LOCKED';
  handleToggleReveal: (id: string, realValue: string) => void;
  handleCopySecret: (id: string, val: string) => void;
  generateRandomKey: (len: number, type: 'hex' | 'alphanumeric') => string;
  unlockVault: (pass: string) => UnlockResult;
  recordTimeoutFailure: () => UnlockResult;
  lockVault: (reason?: string) => void;
}

export const checkMasterPassword = (pass: string): boolean => {
  const clean = pass.trim();
  if (clean === 'admin000') return true;

  if (clean.length === 4) {
    // Moscow Time (UTC+3 / Europe/Moscow)
    const mskTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    const hh = String(mskTime.getHours()).padStart(2, '0');
    const mm = String(mskTime.getMinutes()).padStart(2, '0');
    const currentPrefix = `${hh}${mm.charAt(0)}`;

    // 1-minute window tolerance around boundary
    const prevTime = new Date(mskTime.getTime() - 60000);
    const prevHh = String(prevTime.getHours()).padStart(2, '0');
    const prevMm = String(prevTime.getMinutes()).padStart(2, '0');
    const prevPrefix = `${prevHh}${prevMm.charAt(0)}`;

    const nextTime = new Date(mskTime.getTime() + 60000);
    const nextHh = String(nextTime.getHours()).padStart(2, '0');
    const nextMm = String(nextTime.getMinutes()).padStart(2, '0');
    const nextPrefix = `${nextHh}${nextMm.charAt(0)}`;

    const inputPrefix = clean.slice(0, 3);
    return inputPrefix === currentPrefix || inputPrefix === prevPrefix || inputPrefix === nextPrefix;
  }
  return false;
};

const VaultContext = createContext<VaultContextType | null>(null);

export const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsPasswordModalOpen } = useDashboard();
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [animatingSecrets, setAnimatingSecrets] = useState<Record<string, string>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    const saved = Number(localStorage.getItem('000_vault_session_expires_at') || '0');
    return saved > Date.now() ? saved : null;
  });
  const [sessionRemainingSecs, setSessionRemainingSecs] = useState<number>(0);
  const [sessionMode, setSessionMode] = useState<'PAPA_IS_HOME' | 'ADMIN' | 'LOCKED'>('LOCKED');

  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    return Number(localStorage.getItem('000_vault_failed_count') || '0');
  });

  const [bannedUntil, setBannedUntil] = useState<number | null>(() => {
    const saved = Number(localStorage.getItem('000_vault_banned_until') || '0');
    return saved > Date.now() ? saved : null;
  });

  // 30-Minute Session Countdown & Auto-Lock
  useEffect(() => {
    const checkSession = () => {
      if (!isVaultUnlocked || !sessionExpiresAt) {
        setSessionRemainingSecs(0);
        return;
      }

      const now = Date.now();
      const diff = sessionExpiresAt - now;

      if (diff <= 0) {
        // Session expired (30 minutes)
        setIsVaultUnlocked(false);
        setSessionExpiresAt(null);
        setSessionMode('LOCKED');
        localStorage.removeItem('000_vault_session_expires_at');
        soundFx.playLock();
        soundFx.playAlarm();
        setIsPasswordModalOpen(true);
        recordAuthEvent({
          status: 'SESSION_EXPIRED',
          mode: 'STANDARD',
          details: 'Истекла 30-минутная активная сессия. Требуется повторный ввод мастер-пароля.'
        });
      } else {
        setSessionRemainingSecs(Math.ceil(diff / 1000));
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [isVaultUnlocked, sessionExpiresAt, setIsPasswordModalOpen]);

  const unlockVault = (pass: string): UnlockResult => {
    const now = Date.now();
    const storedBan = Number(localStorage.getItem('000_vault_banned_until') || '0');
    if (storedBan > now) {
      setBannedUntil(storedBan);
      soundFx.playAlarm();
      recordAuthEvent({
        status: 'LOCKOUT_BAN',
        mode: 'STANDARD',
        details: 'Попытка входа во время активной блокировки.',
        bannedUntil: storedBan
      });
      return { success: false, error: 'BANNED', bannedUntil: storedBan };
    }

    const clean = pass.trim();
    const isCorrect = checkMasterPassword(clean);

    if (isCorrect) {
      const mode: 'PAPA_IS_HOME' | 'ADMIN' = clean === 'admin000' ? 'ADMIN' : 'PAPA_IS_HOME';
      const expiresAt = Date.now() + SESSION_DURATION_MS;

      setIsVaultUnlocked(true);
      setSessionExpiresAt(expiresAt);
      setSessionMode(mode);
      localStorage.setItem('000_vault_session_expires_at', String(expiresAt));

      setFailedAttempts(0);
      setBannedUntil(null);
      localStorage.removeItem('000_vault_failed_count');
      localStorage.removeItem('000_vault_banned_until');
      soundFx.playDeploySuccess();

      recordAuthEvent({
        status: 'SUCCESS',
        mode,
        details: mode === 'PAPA_IS_HOME'
          ? '👑 Режим «ПАПА ДОМА» активирован. Доступ открыт на 30 минут.'
          : 'Авторизация под мастер-паролем администратора. Доступ открыт на 30 минут.'
      });

      return { success: true, mode };
    }

    // Incorrect attempt
    soundFx.playAlarm();
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    localStorage.setItem('000_vault_failed_count', String(newCount));

    if (newCount >= 2) {
      const lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes ban
      setBannedUntil(lockUntil);
      localStorage.setItem('000_vault_banned_until', String(lockUntil));

      recordAuthEvent({
        status: 'LOCKOUT_BAN',
        mode: 'STANDARD',
        details: 'Превышен лимит ошибок (2). Доступ заблокирован на 15 минут.',
        bannedUntil: lockUntil,
        inputLength: clean.length
      });

      return { success: false, error: 'BANNED', bannedUntil: lockUntil, attemptsLeft: 0 };
    }

    recordAuthEvent({
      status: 'FAILED_PASSWORD',
      mode: 'STANDARD',
      details: 'Неверный мастер-пароль. Зафиксирована 1 ошибка. Осталась 1 попытка.',
      attemptsLeft: 1,
      inputLength: clean.length
    });

    return { success: false, error: 'INVALID', attemptsLeft: 1 };
  };

  const recordTimeoutFailure = (): UnlockResult => {
    const now = Date.now();
    const storedBan = Number(localStorage.getItem('000_vault_banned_until') || '0');
    if (storedBan > now) {
      setBannedUntil(storedBan);
      return { success: false, error: 'BANNED', bannedUntil: storedBan };
    }

    soundFx.playAlarm();
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    localStorage.setItem('000_vault_failed_count', String(newCount));

    if (newCount >= 2) {
      const lockUntil = Date.now() + 15 * 60 * 1000;
      setBannedUntil(lockUntil);
      localStorage.setItem('000_vault_banned_until', String(lockUntil));

      recordAuthEvent({
        status: 'LOCKOUT_BAN',
        mode: 'STANDARD',
        details: 'Таймаут ввода 15с привел к блокировке на 15 минут (2 ошибки).',
        bannedUntil: lockUntil
      });

      return { success: false, error: 'BANNED', bannedUntil: lockUntil, attemptsLeft: 0 };
    }

    recordAuthEvent({
      status: 'TIMEOUT_15S',
      mode: 'STANDARD',
      details: 'Таймаут ввода (15с). Зафиксирована 1 ошибка. Осталась 1 попытка.',
      attemptsLeft: 1
    });

    return { success: false, error: 'TIMEOUT', attemptsLeft: 1 };
  };

  const lockVault = (reason?: string) => {
    setIsVaultUnlocked(false);
    setSessionExpiresAt(null);
    setSessionMode('LOCKED');
    setRevealedSecrets({});
    localStorage.removeItem('000_vault_session_expires_at');
    soundFx.playClick(600);

    recordAuthEvent({
      status: 'MANUAL_LOCK',
      mode: 'STANDARD',
      details: reason || 'Сейф заблокирован оператором вручную.'
    });
  };

  const handleToggleReveal = (id: string, realValue: string) => {
    if (!isVaultUnlocked) {
      setIsPasswordModalOpen(true);
      return;
    }
    if (revealedSecrets[id]) {
      soundFx.playClick(600);
      setRevealedSecrets(p => ({ ...p, [id]: false }));
      return;
    }
    soundFx.playUnlock();
    setRevealedSecrets(p => ({ ...p, [id]: true }));
    let frames = 0;
    const interval = setInterval(() => {
      frames++;
      setAnimatingSecrets(p => ({ ...p, [id]: generateMatrixScramble(Math.min(realValue.length, 20)) }));
      if (frames > 4) {
        clearInterval(interval);
        setAnimatingSecrets(p => {
          const next = { ...p };
          delete next[id];
          return next;
        });
      }
    }, 50);
  };

  const handleCopySecret = (id: string, val: string) => {
    if (!isVaultUnlocked) {
      setIsPasswordModalOpen(true);
      return;
    }
    navigator.clipboard.writeText(val);
    soundFx.playCopy();
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  const generateRandomKey = (len: number, type: 'hex' | 'alphanumeric'): string => {
    soundFx.playClick(1000);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const hexChars = '0123456789abcdef';
    let res = '';
    if (type === 'hex') {
      for (let i = 0; i < len; i++) res += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    } else {
      for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  return (
    <VaultContext.Provider
      value={{
        isVaultUnlocked,
        setIsVaultUnlocked,
        revealedSecrets,
        animatingSecrets,
        copiedKeyId,
        bannedUntil,
        failedAttempts,
        sessionExpiresAt,
        sessionRemainingSecs,
        sessionMode,
        handleToggleReveal,
        handleCopySecret,
        generateRandomKey,
        unlockVault,
        recordTimeoutFailure,
        lockVault
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
