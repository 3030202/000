export interface AuthAuditRecord {
  id: string;
  timestamp: string; // ISO string
  mskTimeStr: string; // e.g. "27.08.2026, 06:40:12 MSK"
  status: 'SUCCESS' | 'FAILED_PASSWORD' | 'TIMEOUT_15S' | 'LOCKOUT_BAN' | 'SESSION_EXPIRED' | 'MANUAL_LOCK';
  mode: 'PAPA_IS_HOME' | 'ADMIN' | 'STANDARD';
  details: string;
  attemptsLeft?: number;
  bannedUntil?: number;
  inputLength?: number;
}

export const getMoscowTimeString = (date = new Date()): string => {
  return date.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' MSK';
};

const STORAGE_KEY = '000_auth_audit_records';

export const getAuthAuditRecords = (): AuthAuditRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

export const recordAuthEvent = (
  entry: Omit<AuthAuditRecord, 'id' | 'timestamp' | 'mskTimeStr'>
): AuthAuditRecord => {
  const newRecord: AuthAuditRecord = {
    ...entry,
    id: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    mskTimeStr: getMoscowTimeString()
  };

  try {
    const existing = getAuthAuditRecords();
    const updated = [newRecord, ...existing].slice(0, 500); // retain last 500 attempts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('000_auth_audit_updated', { detail: newRecord }));
  } catch (err) {
    console.error('Failed to save auth audit log:', err);
  }

  return newRecord;
};

export const clearAuthAuditRecords = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('000_auth_audit_updated'));
  } catch {}
};

export const exportAuthAuditJson = (): string => {
  const records = getAuthAuditRecords();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      mskTime: getMoscowTimeString(),
      totalRecords: records.length,
      records
    },
    null,
    2
  );
};
