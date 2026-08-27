import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, KeyRound, Timer, ShieldCheck, AlertTriangle, Delete, RotateCcw, Crown, Sparkles, Hourglass, RefreshCw } from 'lucide-react';
import { soundFx } from '../services/soundFx';
import { UnlockResult, useVault, checkMasterPassword } from '../context/VaultContext';
import { recordAuthEvent } from '../services/authAuditLog';

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
  const { isVaultUnlocked, bannedUntil } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [banRemainingSecs, setBanRemainingSecs] = useState<number>(0);
  const [timeoutMs, setTimeoutMs] = useState<number>(15000); // 15.0s timeout
  const [isPapaHomeCelebration, setIsPapaHomeCelebration] = useState(false);
  const [isTimeOutOverlay, setIsTimeOutOverlay] = useState(false);

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

  // 2. 15-Second Entry Timeout Timer (resets on input, try-again, or attempt)
  useEffect(() => {
    if (!isOpen || isVaultUnlocked || isBanned || isPapaHomeCelebration || isTimeOutOverlay) {
      return;
    }

    const startTimestamp = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const left = Math.max(0, 15000 - elapsed);
      setTimeoutMs(left);

      if (left <= 0) {
        clearInterval(interval);
        // Timeout expired: show "Время и стекло ))" overlay — DOES NOT count as error!
        soundFx.playClick(600);
        setPassword('');
        setError('');
        setIsTimeOutOverlay(true);
        recordAuthEvent({
          status: 'TIMEOUT_15S',
          mode: 'STANDARD',
          details: '⏳ «Время и стекло ))» — таймаут 15с. Ошибок не начислено, попытки сохранены.'
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isVaultUnlocked, isBanned, isPapaHomeCelebration, isTimeOutOverlay]);

  // Focus input when opened and not overlayed
  useEffect(() => {
    if (isOpen && !isBanned && !isTimeOutOverlay) {
      inputRef.current?.focus();
    }
  }, [isOpen, isBanned, isTimeOutOverlay]);

  // Reset overlay when modal closes or unlocks
  useEffect(() => {
    if (!isOpen || isVaultUnlocked) {
      setIsTimeOutOverlay(false);
      setTimeoutMs(15000);
    }
  }, [isOpen, isVaultUnlocked]);

  const handleTryAgain = () => {
    soundFx.playClick(900);
    setIsTimeOutOverlay(false);
    setTimeoutMs(15000);
    setPassword('');
    setError('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  if (!isOpen && isVaultUnlocked) return null;

  const formatBanTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeoutSeconds = (timeoutMs / 1000).toFixed(1);
  const timeoutPercent = Math.max(0, Math.min(100, (timeoutMs / 15000) * 100));

  // Core handler: tests for instant auto-unlock ("ПАПА ДОМА")
  const processInput = (newVal: string) => {
    if (isBanned || isPapaHomeCelebration) return;

    soundFx.playClick(1000);
    setPassword(newVal);
    setError('');

    // Instant match check: if correct, auto-accept immediately without any button press!
    if (checkMasterPassword(newVal)) {
      soundFx.playDeploySuccess();
      setIsPapaHomeCelebration(true);
      onUnlock(newVal);

      setTimeout(() => {
        setIsPapaHomeCelebration(false);
        setPassword('');
        setError('');
        onClose();
      }, 350);
      return;
    }

    // If typed 4+ characters and doesn't match 'admin000' and length is at least 4
    if (newVal.length >= 4 && newVal !== 'admin000'.slice(0, newVal.length)) {
      // Check full validity
      const res = onUnlock(newVal);
      if (!res.success) {
        soundFx.playAlarm();
        setTimeoutMs(15000);
        setPassword('');
        if (res.error === 'BANNED' || (res.bannedUntil && res.bannedUntil > Date.now())) {
          setError('⛔ Доступ заблокирован на 15 минут из-за 2 неверных попыток.');
        } else if (res.attemptsLeft !== undefined) {
          setError(`⚠️ Неверный код! Осталась ${res.attemptsLeft} попытка до блокировки на 15 минут.`);
        }
      }
    }
  };

  const handleNumpadDigit = (digit: string) => {
    processInput(password + digit);
  };

  const handleNumpadBackspace = () => {
    soundFx.playClick(700);
    processInput(password.slice(0, -1));
  };

  const handleNumpadClear = () => {
    soundFx.playClick(500);
    processInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned || !password || isPapaHomeCelebration) return;

    const res = onUnlock(password);
    if (res.success) {
      soundFx.playDeploySuccess();
      setIsPapaHomeCelebration(true);
      setTimeout(() => {
        setIsPapaHomeCelebration(false);
        setPassword('');
        setError('');
        onClose();
      }, 300);
    } else {
      soundFx.playAlarm();
      setPassword('');
      setTimeoutMs(15000);
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
        padding: '12px',
        backgroundColor: 'rgba(2, 4, 8, 0.92)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)'
      }}
    >
      {/* Heavy Cyber Armored Safe Card */}
      <div
        className="vault-safe-door"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          border: isBanned
            ? '2px solid rgba(248, 113, 113, 0.8)'
            : isPapaHomeCelebration
            ? '2px solid var(--yellow)'
            : isTimeOutOverlay
            ? '2px solid var(--cyan)'
            : '2px solid rgba(56, 189, 248, 0.6)',
          boxShadow: isBanned
            ? '0 0 60px rgba(248, 113, 113, 0.35), inset 0 0 30px rgba(0, 0, 0, 0.9)'
            : isPapaHomeCelebration
            ? '0 0 70px rgba(250, 204, 21, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.9)'
            : isTimeOutOverlay
            ? '0 0 60px rgba(56, 189, 248, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.9)'
            : '0 0 60px rgba(56, 189, 248, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Safe Header & Dial Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: isBanned
                ? 'radial-gradient(circle, #450a0a 0%, #1f0404 100%)'
                : isPapaHomeCelebration
                ? 'radial-gradient(circle, #713f12 0%, #1c1917 100%)'
                : isTimeOutOverlay
                ? 'radial-gradient(circle, #0e3a5a 0%, #031424 100%)'
                : 'radial-gradient(circle, #0c2340 0%, #061120 100%)',
              border: isBanned ? '2px solid var(--red)' : isPapaHomeCelebration ? '2px solid var(--yellow)' : '2px solid var(--cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isBanned ? '0 0 15px rgba(248, 113, 113, 0.5)' : isPapaHomeCelebration ? '0 0 20px rgba(250, 204, 21, 0.6)' : '0 0 15px rgba(56, 189, 248, 0.4)'
            }}
          >
            {/* Rotating dial ring */}
            <div
              className={!isBanned ? 'safe-dial-spinner' : ''}
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1px dashed ' + (isBanned ? 'var(--red)' : isPapaHomeCelebration ? 'var(--yellow)' : 'var(--cyan)'),
                opacity: 0.7
              }}
            />
            {isBanned ? (
              <ShieldAlert style={{ width: '22px', height: '22px', color: 'var(--red)' }} />
            ) : isPapaHomeCelebration ? (
              <Crown style={{ width: '22px', height: '22px', color: 'var(--yellow)' }} />
            ) : isTimeOutOverlay ? (
              <Hourglass style={{ width: '22px', height: '22px', color: 'var(--cyan)' }} />
            ) : (
              <Lock style={{ width: '22px', height: '22px', color: 'var(--cyan)' }} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                {isBanned ? 'SECURITY LOCKOUT ACTIVE' : isPapaHomeCelebration ? '👑 ПАПА ДОМА' : isTimeOutOverlay ? '⏳ ВРЕМЯ И СТЕКЛО ))' : '000 CYBER SAFE GATE'}
              </span>
              <span className={`pill ${isBanned ? 'red' : isPapaHomeCelebration ? 'yellow' : isTimeOutOverlay ? 'cyan' : 'green'}`} style={{ fontSize: '8px' }}>
                {isBanned ? '● SHUTDOWN' : isPapaHomeCelebration ? '● ДОСТУП РАЗРЕШЕН' : isTimeOutOverlay ? '● ВРЕМЯ И СТЕКЛО' : '● ARMORED'}
              </span>
            </div>
            <p style={{ fontSize: '9.5px', color: 'var(--fg-dim)', margin: '2px 0 0 0', lineHeight: '1.3' }}>
              {isBanned
                ? 'Превышен лимит попыток. Блокировка на 15 минут.'
                : isPapaHomeCelebration
                ? 'Режим «ПАПА ДОМА» активирован. Сессия: 30 минут.'
                : isTimeOutOverlay
                ? 'Время вышло, но ошибок нет. Нажмите «Попробовать ещё».'
                : 'Автопринятие при вводе верного кода без нажатия кнопки.'}
            </p>
          </div>
        </div>

        {/* ПАПА ДОМА Celebration Banner */}
        {isPapaHomeCelebration && (
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.2), rgba(56, 189, 248, 0.2))',
              border: '1px solid var(--yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--yellow)',
              fontSize: '11px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              animation: 'pulse 1s infinite'
            }}
          >
            <Sparkles style={{ width: '16px', height: '16px' }} />
            <span>👑 РЕЖИМ «ПАПА ДОМА» АКТИВИРОВАН!</span>
          </div>
        )}

        {isTimeOutOverlay ? (
          /* ВРЕМЯ И СТЕКЛО )) Заглушка */
          <div
            style={{
              padding: '24px 16px',
              borderRadius: '12px',
              background: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.15) 0%, rgba(2, 6, 23, 0.95) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '14px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #0e3a5a 0%, #031424 100%)',
                border: '2px solid var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)'
              }}
            >
              <Hourglass style={{ width: '30px', height: '30px', color: 'var(--cyan)' }} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  color: '#fff',
                  fontFamily: 'var(--font-heading)',
                  textShadow: '0 0 18px rgba(56, 189, 248, 0.7)'
                }}
              >
                Время и стекло ))
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--fg-dim)',
                  margin: '8px 0 0 0',
                  lineHeight: '1.45'
                }}
              >
                Обратный отсчёт (15 сек) завершён.<br />
                Время истекло, но это <strong style={{ color: 'var(--green)' }}>не считается за ошибку</strong> — попытки сохранены!
              </p>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: 'var(--green)',
                fontSize: '9.5px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
            >
              <ShieldCheck style={{ width: '13px', height: '13px' }} />
              <span>0 ОШИБОК · ПОПЫТКИ НЕ СГОРЕЛИ</span>
            </div>

            <button
              type="button"
              onClick={handleTryAgain}
              className="btn-accent"
              style={{
                width: '100%',
                padding: '11px 0',
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                color: '#000',
                border: 'none',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)'
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              <span>ПОПРОБОВАТЬ ЕЩЁ</span>
            </button>
          </div>
        ) : (
          <>
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
                <div style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>
                  Lockout Ban Countdown: <strong style={{ color: 'var(--yellow)', fontSize: '13px', background: '#000', padding: '2px 8px', borderRadius: '4px' }}>{formatBanTime(banRemainingSecs)}</strong>
                </div>
              </div>
            ) : (
          /* 15-Second Session Progress Bar */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5px', fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--fg-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Timer style={{ width: '11px', height: '11px', color: timeoutMs < 4000 ? 'var(--red)' : 'var(--yellow)' }} />
                ТАЙМАУТ ВВОДА:
              </span>
              <span
                style={{
                  fontWeight: 'bold',
                  color: timeoutMs < 4000 ? 'var(--red)' : timeoutMs < 8000 ? 'var(--yellow)' : 'var(--cyan)'
                }}
              >
                {timeoutSeconds}с
              </span>
            </div>

            {/* Progress track */}
            <div
              style={{
                width: '100%',
                height: '4px',
                background: '#04070e',
                borderRadius: '2px',
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

        {/* Code Input Display */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <label style={{ fontSize: '9px', fontFamily: 'monospace', color: 'var(--fg-muted)' }}>
                КОД ДОСТУПА («ПАПА ДОМА»)
              </label>
              <span style={{ fontSize: '8px', color: 'var(--fg-dim)' }}>
                {isBanned ? '0 ПОПЫТОК' : 'АВТОВХОД ПРИ СОВПАДЕНИИ'}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="password"
                disabled={isBanned || isPapaHomeCelebration}
                value={password}
                onChange={(e) => processInput(e.target.value)}
                placeholder={isBanned ? 'Заблокировано...' : '••••'}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#040710',
                  border: isBanned ? '1px solid #7f1d1d' : isPapaHomeCelebration ? '1px solid var(--yellow)' : '1px solid var(--border-focus)',
                  borderRadius: '6px',
                  color: isPapaHomeCelebration ? 'var(--yellow)' : '#fff',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  letterSpacing: '5px',
                  textAlign: 'center',
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
                padding: '6px 8px',
                background: 'rgba(69, 10, 10, 0.7)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                borderRadius: '6px',
                color: 'var(--red)',
                fontSize: '9px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <AlertTriangle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* CYBER DIGITAL NUMPAD */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              background: '#02040a',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
              <button
                key={digit}
                type="button"
                disabled={isBanned || isPapaHomeCelebration}
                onClick={() => handleNumpadDigit(digit)}
                style={{
                  padding: '10px 0',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  background: '#060a18',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: isBanned ? 'not-allowed' : 'pointer',
                  transition: 'all 0.1s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {digit}
              </button>
            ))}

            {/* Backspace Button */}
            <button
              type="button"
              disabled={isBanned || isPapaHomeCelebration || !password}
              onClick={handleNumpadBackspace}
              style={{
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                background: '#0a0d1a',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: 'var(--red)',
                cursor: isBanned ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}
              title="Delete last digit"
            >
              <Delete style={{ width: '15px', height: '15px' }} />
            </button>

            {/* 0 Button */}
            <button
              type="button"
              disabled={isBanned || isPapaHomeCelebration}
              onClick={() => handleNumpadDigit('0')}
              style={{
                padding: '10px 0',
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                background: '#060a18',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                color: '#fff',
                cursor: isBanned ? 'not-allowed' : 'pointer'
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              0
            </button>

            {/* Clear Button */}
            <button
              type="button"
              disabled={isBanned || isPapaHomeCelebration || !password}
              onClick={handleNumpadClear}
              style={{
                padding: '10px 0',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                background: '#0a0d1a',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                borderRadius: '6px',
                color: 'var(--yellow)',
                cursor: isBanned ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}
              title="Clear input"
            >
              <RotateCcw style={{ width: '13px', height: '13px' }} />
              <span>C</span>
            </button>
          </div>

          {/* Footer Security Badges & Session Duration Notice */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8px', color: 'var(--fg-muted)', fontFamily: 'monospace' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldCheck style={{ width: '10px', height: '10px', color: 'var(--cyan)' }} />
              30 МИНУТ СЕССИЯ
            </span>
            <span style={{ color: 'var(--cyan)' }}>РЕЖИМ «ПАПА ДОМА»</span>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
};
