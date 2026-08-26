import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

export const HealthMatrixWidget: React.FC = () => {
  const { healthEndpoints } = useDashboard();

  return (
    <table className="tui-table">
      <thead>
        <tr>
          <th>SERVICE</th>
          <th>STATUS</th>
          <th>RTT</th>
          <th>24H SLA</th>
          <th>SPARK</th>
        </tr>
      </thead>
      <tbody>
        {healthEndpoints.map(e => (
          <tr key={e.id}>
            <td style={{ color: '#fff' }}>{e.name}</td>
            <td>
              <span className={`dot ${e.status === 'operational' ? '' : 'yellow'}`}></span>
              {e.status}
            </td>
            <td style={{ color: 'var(--green)' }}>{e.latencyMs}ms</td>
            <td>{e.uptime24h}%</td>
            <td className="spark"> ▂▃▅▆▇</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
