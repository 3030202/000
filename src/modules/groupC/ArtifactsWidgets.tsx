import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

export const ArtifactsRegistryWidget: React.FC = () => {
  const { artifacts } = useDashboard();

  return (
    <table className="tui-table">
      <thead>
        <tr>
          <th>ARTIFACT</th>
          <th>VER</th>
          <th>SIZE</th>
          <th>SHA256</th>
        </tr>
      </thead>
      <tbody>
        {artifacts.map(a => (
          <tr key={a.id}>
            <td style={{ color: '#fff' }}>{a.name}</td>
            <td><span className="pill cyan">{a.version}</span></td>
            <td>{a.size}</td>
            <td style={{ color: 'var(--fg-muted)' }}>{a.sha256.substring(0, 16)}...</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
