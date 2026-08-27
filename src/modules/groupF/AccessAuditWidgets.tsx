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
  Filter
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

  const successCount = records.filter(r => r.status === 'SUCCESS').length;
  const failedCount = records.filter(r => r.status === 'FAILED_PASSWORD' || r.status === 'TIMEOUT_15S').length;

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
          border: isVaultUnlocked ? '1px solid var(--yellow)' : '1px solid rgba(239, 68, 68, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '3px 5px',
              borderRadius: '3px',
              background: '#02040a',
              border: '1px solid rgba(255,255,255,0.04)',
              fontSize: '8px',
              fontFamily: 'monospace'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
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
              <span style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rec.details}
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

  const handleClear = () => {
    if (window.confirm('Очистить весь журнал попыток авторизации? Это действие необратимо.')) {
      soundFx.playAlarm();
      clearAuthAuditRecords();
    }
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
          border: isVaultUnlocked ? '1px solid var(--yellow)' : '1px solid rgba(239, 68, 68, 0.4)'
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
              border: isVaultUnlocked ? '2px solid var(--yellow)' : '2px solid var(--red)'
            }}
          >
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
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--yellow)', fontFamily: 'monospace' }}>
                {formatSecs(sessionRemainingSecs)}
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
          <div style={{ fontSize: '8.5px', color: 'var(--cyan)' }}>ТАЙМАУТЫ (15 СЕК)</div>
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
            { id: 'TIMEOUT_15S', label: `⏳ Таймауты 15с (${timeoutCount})` },
            { id: 'LOCKOUT_BAN', label: `⛔ Баны (${banCount})` },
            { id: 'SESSION_EXPIRED', label: `⌛ Истечение 30м (${expiredCount})` }
          ].map(f => (
            <button
              key={f.id}
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
              placeholder="Поиск по журналу..."
              style={{ fontSize: '9px', padding: '3px 6px', width: '130px' }}
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

          <button
            onClick={handleClear}
            style={{ fontSize: '8.5px', padding: '3px 8px', color: 'var(--red)', borderColor: 'var(--red)', display: 'flex', alignItems: 'center', gap: '3px' }}
            title="Очистить журнал"
          >
            <Trash2 style={{ width: '12px', height: '12px' }} />
            <span>Очистить</span>
          </button>
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
                const isFail = rec.status === 'FAILED_PASSWORD';

                return (
                  <tr
                    key={rec.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: isSuccess
                        ? 'rgba(250, 204, 21, 0.04)'
                        : isBan
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'transparent'
                    }}
                  >
                    <td style={{ padding: '6px 8px' }}>
                      <span
                        className={`pill ${
                          isSuccess
                            ? 'yellow'
                            : isBan
                            ? 'red'
                            : isTimeout
                            ? 'yellow'
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
                          ? '⏳ ТАЙМАУТ 15с'
                          : isExpired
                          ? '⌛ ИСТЕКЛА (30М)'
                          : rec.status === 'MANUAL_LOCK'
                          ? '🔒 БЛОКИРОВКА'
                          : '❌ ОШИБКА'}
                      </span>
                    </td>

                    <td style={{ padding: '6px 8px', color: 'var(--cyan)' }}>
                      {rec.mskTimeStr}
                    </td>

                    <td style={{ padding: '6px 8px', color: rec.mode === 'PAPA_IS_HOME' ? 'var(--yellow)' : 'var(--fg-dim)' }}>
                      {rec.mode}
                    </td>

                    <td style={{ padding: '6px 8px', color: isSuccess ? 'var(--yellow)' : '#fff' }}>
                      {rec.details}
                    </td>

                    <td style={{ padding: '6px 8px', color: 'var(--fg-dim)' }}>
                      {rec.attemptsLeft !== undefined ? `Попыток: ${rec.attemptsLeft}` : '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--fg-dim)' }}>
                  Нет записей, соответствующих выбранному фильтру.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
