import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Lock,
  Unlock,
  Timer,
  Clock,
  Download,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check
} from 'lucide-react';
import { soundFx } from '../../services/soundFx';
import { useVault } from '../../context/VaultContext';
import { useDashboard } from '../../context/DashboardContext';
import {
  AuthAuditRecord,
  getAuthAuditRecords,
  clearAuthAuditRecords,
  exportAuthAuditJson,
  getMoscowTimeString
} from '../../services/authAuditLog';

export const AccessAuditLedgerWidget: React.FC = () => {
  const { isVaultUnlocked, sessionRemainingSecs, sessionMode, lockVault } = useVault();
  const { setIsPasswordModalOpen } = useDashboard();
  const [records, setRecords] = useState<AuthAuditRecord[]>(getAuthAuditRecords);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setRecords(getAuthAuditRecords());
    };
    window.addEventListener('000_auth_audit_updated', handleUpdate);
    return () => window.removeEventListener('000_auth_audit_updated', handleUpdate);
  }, []);

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyRecord = (rec: AuthAuditRecord) => {
    soundFx.playClick(1100);
    const textToCopy = `[${rec.mskTimeStr}] ${rec.status} (${rec.mode}): ${rec.details}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const successCount = records.filter(r => r.status === 'SUCCESS').length;
  const failedCount = records.filter(r => r.status === 'FAILED_PASSWORD').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
      {/* Session Status Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 8px',
          borderRadius: '6px',
          background: isVaultUnlocked
            ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15), rgba(56, 189, 248, 0.15))'
            : 'rgba(239, 68, 68, 0.1)',
          border: isVaultUnlocked ? '1px solid var(--yellow)' : '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: isVaultUnlocked ? '0 0 10px rgba(250, 204, 21, 0.15)' : '0 0 10px rgba(239, 68, 68, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isVaultUnlocked ? 'var(--yellow)' : 'var(--red)',
              boxShadow: isVaultUnlocked ? '0 0 6px var(--yellow)' : '0 0 6px var(--red)',
              display: 'inline-block',
              flexShrink: 0
            }}
          />
          {isVaultUnlocked ? (
            <Crown style={{ width: '14px', height: '14px', color: 'var(--yellow)' }} />
          ) : (
            <Lock style={{ width: '14px', height: '14px', color: 'var(--red)' }} />
          )}
          <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: isVaultUnlocked ? 'var(--yellow)' : 'var(--red)', fontFamily: 'monospace' }}>
            {isVaultUnlocked ? '👑 РЕЖИМ «ПАПА ДОМА»' : '🔒 СЕЙФ ЗАБЛОКИРОВАН'}
          </span>
        </div>

        {isVaultUnlocked && (
          <div style={{ fontSize: '9px', color: 'var(--cyan)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Timer style={{ width: '11px', height: '11px' }} />
            <span>{formatSecs(sessionRemainingSecs)}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
        <div style={{ background: '#040714', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '7.5px', color: 'var(--fg-dim)' }}>ВСЕГО ВХОДОВ</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{records.length}</div>
        </div>
        <div style={{ background: '#040714', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '7.5px', color: 'var(--yellow)' }}>ПАПА ДОМА</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--yellow)', fontFamily: 'monospace' }}>{successCount}</div>
        </div>
        <div style={{ background: '#040714', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '7.5px', color: 'var(--red)' }}>ОШИБКИ</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--red)', fontFamily: 'monospace' }}>{failedCount}</div>
        </div>
      </div>

      {/* Recent Attempts List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', minHeight: '80px' }}>
        <div style={{ fontSize: '8px', color: 'var(--fg-muted)', fontWeight: 'bold' }}>ПОСЛЕДНИЕ СОБЫТИЯ ДОСТУПА:</div>
        {records.slice(0, 4).map(rec => (
          <div
            key={rec.id}
            onClick={() => handleCopyRecord(rec)}
            title="Кликните, чтобы скопировать запись"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '3px 5px',
              borderRadius: '3px',
              background: copiedId === rec.id ? 'rgba(56, 189, 248, 0.15)' : '#02040a',
              border: copiedId === rec.id ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.04)',
              fontSize: '8px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
              {copiedId === rec.id ? (
                <Check style={{ width: '10px', height: '10px', color: 'var(--cyan)' }} />
              ) : (
                <span
                  style={{
                    color:
                      rec.status === 'SUCCESS'
                        ? 'var(--yellow)'
                        : rec.status === 'SESSION_EXPIRED'
                        ? 'var(--cyan)'
                        : 'var(--red)',
                    fontWeight: 'bold'
                  }}
                >
                  {rec.status === 'SUCCESS' ? '👑 OK' : rec.status === 'SESSION_EXPIRED' ? '⏳ 30M' : '❌ ERR'}
                </span>
              )}
              <span style={{ color: copiedId === rec.id ? 'var(--cyan)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {copiedId === rec.id ? 'Скопировано в буфер!' : rec.details}
              </span>
            </div>
            <span style={{ color: 'var(--fg-dim)', fontSize: '7.5px', flexShrink: 0 }}>
              {rec.mskTimeStr.split(', ')[1]?.replace(' MSK', '') || ''}
            </span>
          </div>
        ))}
      </div>

      {/* Lock/Unlock Toggle Button */}
      <div>
        {isVaultUnlocked ? (
          <button
            onClick={() => {
              soundFx.playLock();
              lockVault('Ручная блокировка из виджета F3');
            }}
            style={{ width: '100%', fontSize: '8.5px', padding: '3px 0', borderColor: 'var(--red)', color: 'var(--red)' }}
          >
            🔒 Заблокировать сейф сейчас
          </button>
        ) : (
          <button
            className="btn-accent"
            onClick={() => {
              soundFx.playClick(900);
              setIsPasswordModalOpen(true);
            }}
            style={{ width: '100%', fontSize: '8.5px', padding: '3px 0' }}
          >
            🔓 Открыть сейф (Нампад)
          </button>
        )}
      </div>
    </div>
  );
};

export const AccessAuditLedgerWorkbench: React.FC = () => {
  const { isVaultUnlocked, sessionRemainingSecs, sessionMode, lockVault } = useVault();
  const { setIsPasswordModalOpen } = useDashboard();
  const [records, setRecords] = useState<AuthAuditRecord[]>(getAuthAuditRecords);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setRecords(getAuthAuditRecords());
    };
    window.addEventListener('000_auth_audit_updated', handleUpdate);
    return () => window.removeEventListener('000_auth_audit_updated', handleUpdate);
  }, []);

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleExport = () => {
    soundFx.playDeploySuccess();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportAuthAuditJson());
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `000_auth_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleConfirmClear = () => {
    soundFx.playAlarm();
    clearAuthAuditRecords();
    setIsConfirmingClear(false);
  };

  const handleCopyRecord = (rec: AuthAuditRecord) => {
    soundFx.playClick(1200);
    const textToCopy = `[${rec.mskTimeStr}] STATUS: ${rec.status} | MODE: ${rec.mode} | DETAILS: ${rec.details}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredRecords = records.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.details.toLowerCase().includes(q) ||
        r.mskTimeStr.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.mode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const successCount = records.filter(r => r.status === 'SUCCESS').length;
  const failedCount = records.filter(r => r.status === 'FAILED_PASSWORD').length;
  const timeoutCount = records.filter(r => r.status === 'TIMEOUT_15S').length;
  const banCount = records.filter(r => r.status === 'LOCKOUT_BAN').length;
  const expiredCount = records.filter(r => r.status === 'SESSION_EXPIRED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: '8px',
          background: isVaultUnlocked
            ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15), rgba(56, 189, 248, 0.15))'
            : 'rgba(239, 68, 68, 0.12)',
          border: isVaultUnlocked ? '1px solid var(--yellow)' : '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: isVaultUnlocked ? '0 0 16px rgba(250, 204, 21, 0.18)' : '0 0 16px rgba(239, 68, 68, 0.18)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isVaultUnlocked ? '#713f12' : '#450a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isVaultUnlocked ? '2px solid var(--yellow)' : '2px solid var(--red)',
              position: 'relative'
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isVaultUnlocked ? 'var(--yellow)' : 'var(--red)',
                boxShadow: isVaultUnlocked ? '0 0 8px var(--yellow)' : '0 0 8px var(--red)'
              }}
            />
            {isVaultUnlocked ? (
              <Crown style={{ width: '20px', height: '20px', color: 'var(--yellow)' }} />
            ) : (
              <Lock style={{ width: '20px', height: '20px', color: 'var(--red)' }} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: isVaultUnlocked ? 'var(--yellow)' : '#fff', letterSpacing: '1px' }}>
                {isVaultUnlocked ? '👑 РЕЖИМ «ПАПА ДОМА» АКТИВИРОВАН' : '🔒 СЕЙФ ЗАБЛОКИРОВАН'}
              </span>
              <span className={`pill ${isVaultUnlocked ? 'yellow' : 'red'}`} style={{ fontSize: '8px' }}>
                {isVaultUnlocked ? 'СЕССИЯ 30 МИНУТ' : 'ТРЕБУЕТСЯ ВВОД'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--fg-dim)' }}>
              {isVaultUnlocked
                ? 'Автопринятие верного кода без нажатия кнопок. Все события логируются в защищенный журнал.'
                : 'Для разблокировки введите динамический мастер-пароль на цифровом нампаде.'}
            </div>
          </div>
        </div>

        {/* Live Session Timer & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isVaultUnlocked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <div style={{ fontSize: '9px', color: 'var(--fg-dim)', fontFamily: 'monospace' }}>ТАЙМЕР СЕССИИ:</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--yellow)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Timer style={{ width: '14px', height: '14px', color: 'var(--yellow)' }} />
                <span>{formatSecs(sessionRemainingSecs)}</span>
              </div>
            </div>
          ) : (
            <button
              className="btn-accent"
              onClick={() => {
                soundFx.playClick(900);
                setIsPasswordModalOpen(true);
              }}
              style={{ fontSize: '10px', padding: '6px 12px' }}
            >
              🔓 Разблокировать (Нампад)
            </button>
          )}

          {isVaultUnlocked && (
            <button
              onClick={() => {
                soundFx.playLock();
                lockVault('Ручная блокировка из воркбенча F3');
              }}
              style={{ fontSize: '10px', padding: '6px 10px', borderColor: 'var(--red)', color: 'var(--red)' }}
            >
              🔒 Блокировать
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
        <div style={{ background: '#040714', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '8.5px', color: 'var(--fg-dim)' }}>ВСЕГО ЗАПИСЕЙ</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', marginTop: '2px' }}>{records.length}</div>
        </div>
        <div style={{ background: '#040714', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '8.5px', color: 'var(--yellow)' }}>ПАПА ДОМА (ВХОДЫ)</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--yellow)', fontFamily: 'monospace', marginTop: '2px' }}>{successCount}</div>
        </div>
        <div style={{ background: '#040714', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '8.5px', color: 'var(--red)' }}>НЕВЕРНЫЙ ПАРОЛЬ</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--red)', fontFamily: 'monospace', marginTop: '2px' }}>{failedCount}</div>
        </div>
        <div style={{ background: '#040714', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '8.5px', color: 'var(--cyan)' }}>ВРЕМЯ И СТЕКЛО</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--cyan)', fontFamily: 'monospace', marginTop: '2px' }}>{timeoutCount}</div>
        </div>
        <div style={{ background: '#040714', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '8.5px', color: 'var(--purple)' }}>БАНЫ НА 15 МИН</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--purple)', fontFamily: 'monospace', marginTop: '2px' }}>{banCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Все (${records.length})` },
            { id: 'SUCCESS', label: `👑 Папа Дома (${successCount})` },
            { id: 'FAILED_PASSWORD', label: `❌ Ошибки (${failedCount})` },
            { id: 'TIMEOUT_15S', label: `⏳ Время и стекло (${timeoutCount})` },
            { id: 'LOCKOUT_BAN', label: `⛔ Баны (${banCount})` },
            { id: 'SESSION_EXPIRED', label: `⌛ Истечение 30м (${expiredCount})` }
          ].map(f => (
            <button
              key={f.id}
              aria-pressed={statusFilter === f.id}
              aria-label={`Фильтр ${f.label}`}
              onClick={() => {
                soundFx.playClick(900);
                setStatusFilter(f.id);
              }}
              style={{
                fontSize: '8.5px',
                padding: '3px 7px',
                background: statusFilter === f.id ? 'rgba(56, 189, 248, 0.25)' : undefined,
                borderColor: statusFilter === f.id ? 'var(--cyan)' : undefined,
                color: statusFilter === f.id ? 'var(--cyan)' : 'var(--fg-muted)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              placeholder="Поиск (Esc сброс)..."
              style={{ fontSize: '9px', padding: '3px 6px', width: '140px' }}
            />
          </div>

          <button
            onClick={handleExport}
            style={{ fontSize: '8.5px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}
            title="Экспорт журнала в JSON"
          >
            <Download style={{ width: '12px', height: '12px' }} />
            <span>Экспорт JSON</span>
          </button>

          {isConfirmingClear ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--red)' }}>
              <span style={{ fontSize: '8px', color: 'var(--red)', fontFamily: 'monospace', fontWeight: 'bold' }}>⚠️ Очистить?</span>
              <button
                onClick={handleConfirmClear}
                style={{ fontSize: '8px', padding: '1px 5px', color: '#fff', background: 'var(--red)', borderColor: 'var(--red)' }}
              >
                ДА
              </button>
              <button
                onClick={() => setIsConfirmingClear(false)}
                style={{ fontSize: '8px', padding: '1px 5px', color: 'var(--fg-dim)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                soundFx.playClick(700);
                setIsConfirmingClear(true);
              }}
              style={{ fontSize: '8.5px', padding: '3px 8px', color: 'var(--red)', borderColor: 'var(--red)', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="Очистить журнал"
            >
              <Trash2 style={{ width: '12px', height: '12px' }} />
              <span>Очистить</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Attempts Log Table */}
      <div
        style={{
          flex: 1,
          background: '#020306',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          overflowY: 'auto',
          minHeight: '200px'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ background: '#050a18', borderBottom: '1px solid var(--border)', color: 'var(--fg-muted)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>СТАТУС</th>
              <th style={{ padding: '6px 8px' }}>ВРЕМЯ (МСК)</th>
              <th style={{ padding: '6px 8px' }}>РЕЖИМ</th>
              <th style={{ padding: '6px 8px' }}>ДЕТАЛИ СОБЫТИЯ</th>
              <th style={{ padding: '6px 8px' }}>ОСТАТОК</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map(rec => {
                const isSuccess = rec.status === 'SUCCESS';
                const isBan = rec.status === 'LOCKOUT_BAN';
                const isTimeout = rec.status === 'TIMEOUT_15S';
                const isExpired = rec.status === 'SESSION_EXPIRED';
                const isCopied = copiedId === rec.id;

                return (
                  <tr
                    key={rec.id}
                    onClick={() => handleCopyRecord(rec)}
                    title="Кликните, чтобы скопировать запись аудита"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: isCopied
                        ? 'rgba(56, 189, 248, 0.18)'
                        : isSuccess
                        ? 'rgba(250, 204, 21, 0.04)'
                        : isBan
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isCopied ? (
                          <Check style={{ width: '12px', height: '12px', color: 'var(--cyan)' }} />
                        ) : null}
                        <span
                          className={`pill ${
                            isSuccess
                              ? 'yellow'
                              : isBan
                              ? 'red'
                              : isTimeout
                              ? 'cyan'
                              : isExpired
                              ? 'purple'
                              : 'red'
                          }`}
                          style={{ fontSize: '7.5px', fontWeight: 'bold' }}
                        >
                          {isSuccess
                            ? '👑 ПАПА ДОМА'
                            : isBan
                            ? '⛔ БАН 15 МИН'
                            : isTimeout
                            ? '⏳ ВРЕМЯ И СТЕКЛО'
                            : isExpired
                            ? '⌛ ИСТЕКЛА (30М)'
                            : rec.status === 'MANUAL_LOCK'
                            ? '🔒 БЛОКИРОВКА'
                            : '❌ ОШИБКА'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '6px 8px', color: 'var(--cyan)' }}>
                      {rec.mskTimeStr}
                    </td>

                    <td style={{ padding: '6px 8px', color: rec.mode === 'PAPA_IS_HOME' ? 'var(--yellow)' : 'var(--fg-dim)' }}>
                      {rec.mode}
                    </td>

                    <td style={{ padding: '6px 8px', color: isCopied ? 'var(--cyan)' : isSuccess ? 'var(--yellow)' : '#fff' }}>
                      {isCopied ? '📋 Запись скопирована в буфер обмена!' : rec.details}
                    </td>

                    <td style={{ padding: '6px 8px', color: 'var(--fg-dim)' }}>
                      {rec.attemptsLeft !== undefined ? `Попыток: ${rec.attemptsLeft}` : '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--fg-dim)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <Search style={{ width: '20px', height: '20px', color: 'var(--fg-muted)' }} />
                    <span>Записи по выбранным критериям поиска или фильтрации не найдены.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
