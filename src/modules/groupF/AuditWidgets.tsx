import React from 'react';
import { useTools } from '../../context/ToolsContext';

export const AuditLogWidget: React.FC = () => {
  const { auditLogs } = useTools();

  return (
    <table className="tui-table">
      <tbody>
        {auditLogs.slice(0, 10).map(l => (
          <tr key={l.id}>
            <td style={{ color: 'var(--fg-muted)', width: '55px' }}>{l.timestamp}</td>
            <td style={{ color: l.level === 'critical' ? 'var(--red)' : l.level === 'success' ? 'var(--green)' : 'var(--cyan)', fontWeight: 600, width: '110px' }}>
              [{l.action}]
            </td>
            <td style={{ color: 'var(--fg-dim)' }}>{l.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
