import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

export const ProjectTableWidget: React.FC = () => {
  const { projects } = useDashboard();

  return (
    <table className="tui-table">
      <thead>
        <tr>
          <th>STATUS</th>
          <th>PROJECT</th>
          <th>ENV</th>
          <th>RTT</th>
          <th>LINKS</th>
        </tr>
      </thead>
      <tbody>
        {projects.map(p => (
          <tr key={p.id}>
            <td>
              <span className={`dot ${p.status === 'operational' ? '' : p.status === 'degraded' ? 'yellow' : 'red'}`}></span>
              {p.status}
            </td>
            <td style={{ color: '#fff', fontWeight: 600 }}>{p.name}</td>
            <td><span className={`pill ${p.env === 'production' ? 'cyan' : 'yellow'}`}>{p.env}</span></td>
            <td style={{ color: 'var(--green)' }}>{p.latency}ms</td>
            <td>
              <div style={{ display: 'flex', gap: '4px' }}>
                {p.links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>[{l.label}]</a>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const QuickLinksWidget: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      <a href="http://000.localhost:3000" target="_blank" rel="noreferrer"><button>[000 Subdomain]</button></a>
      <a href="https://console.cloud.google.com/run" target="_blank" rel="noreferrer"><button>[GCP Cloud Run]</button></a>
      <a href="https://console.cloud.google.com/bigquery" target="_blank" rel="noreferrer"><button>[BigQuery]</button></a>
      <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"><button>[Firebase]</button></a>
      <a href="https://ai.google.dev" target="_blank" rel="noreferrer"><button>[Gemini API]</button></a>
      <a href="https://github.com" target="_blank" rel="noreferrer"><button>[GitHub]</button></a>
    </div>
  );
};
