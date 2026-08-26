import React, { createContext, useContext, useState } from 'react';
import { soundFx } from '../services/soundFx';
import { generateMatrixScramble } from '../services/crypto';
import { useDashboard } from './DashboardContext';

export interface VaultContextType {
  isVaultUnlocked: boolean;
  setIsVaultUnlocked: (unlocked: boolean) => void;
  revealedSecrets: Record<string, boolean>;
  animatingSecrets: Record<string, string>;
  copiedKeyId: string | null;
  handleToggleReveal: (id: string, realValue: string) => void;
  handleCopySecret: (id: string, val: string) => void;
  generateRandomKey: (len: number, type: 'hex' | 'alphanumeric') => string;
  unlockVault: (pass: string) => boolean;
  lockVault: () => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsPasswordModalOpen } = useDashboard();
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [animatingSecrets, setAnimatingSecrets] = useState<Record<string, string>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const unlockVault = (pass: string): boolean => {
    const clean = pass.trim();
    if (clean === 'admin000') {
      setIsVaultUnlocked(true);
      soundFx.playDeploySuccess();
      return true;
    }

    if (clean.length === 4) {
      const now = new Date();
      // Moscow Time (UTC+3 / Europe/Moscow)
      const mskTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
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
      if (inputPrefix === currentPrefix || inputPrefix === prevPrefix || inputPrefix === nextPrefix) {
        setIsVaultUnlocked(true);
        soundFx.playDeploySuccess();
        return true;
      }
    }

    soundFx.playAlarm();
    return false;
  };

  const lockVault = () => {
    setIsVaultUnlocked(false);
    setRevealedSecrets({});
    soundFx.playClick(600);
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
        handleToggleReveal,
        handleCopySecret,
        generateRandomKey,
        unlockVault,
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
