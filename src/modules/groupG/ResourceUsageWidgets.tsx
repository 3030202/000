import React, { useState, useEffect } from 'react';
import { soundFx } from '../../services/soundFx';

interface ProcessItem {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
  state: 'R' | 'S' | 'D';
}

const SAMPLE_PROCESSES: ProcessItem[] = [
  { pid: 1420, user: 'root', cpu: 12.4, mem: 4.8, command: '000-gateway-core --port=3000', state: 'R' },
  { pid: 902, user: 'caddy', cpu: 4.2, mem: 2.1, command: 'caddy run --config /etc/caddy/Caddyfile', state: 'S' },
  { pid: 2108, user: 'postgres', cpu: 3.8, mem: 14.2, command: 'postgres: mission_control db_master', state: 'S' },
  { pid: 3120, user: 'node', cpu: 2.1, mem: 8.5, command: 'node /app/gemini-agent-service.js', state: 'S' },
  { pid: 884, user: 'redis', cpu: 1.1, mem: 3.4, command: 'redis-server *:6379', state: 'S' },
  { pid: 402, user: 'root', cpu: 0.8, mem: 1.2, command: 'docker-containerd --listen /run/containerd.sock', state: 'S' },
];

export const ResourceUsageWidget: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(24.8);
  const [ramUsage, setRamUsage] = useState(42.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(p => Math.min(95, Math.max(10, +(p + (Math.random() * 6 - 3)).toFixed(1))));
      setRamUsage(p => Math.min(85, Math.max(30, +(p + (Math.random() * 1.5 - 0.75)).toFixed(1))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const renderBar = (pct: number, colorVar: string) => {
    const totalBars = 16;
    const filled = Math.round((pct / 100) * totalBars);
    const empty = totalBars - filled;
    return (
      <span style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
        <span style={{ color: colorVar }}>{'█'.repeat(filled)}</span>
        <span style={{ color: 'var(--border)' }}>{'░'.repeat(empty)}</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '4px' }}>
      <div className="tui-row">
        <span style={{ color: 'var(--fg-dim)', width: '65px' }}>CPU TOTAL</span>
        <div>{renderBar(cpuUsage, 'var(--cyan)')}</div>
        <span style={{ color: 'var(--cyan)', fontWeight: 'bold', width: '42px', textAlign: 'right' }}>{cpuUsage}%</span>
      </div>

      <div className="tui-row">
        <span style={{ color: 'var(--fg-dim)', width: '65px' }}>RAM 8GB</span>
        <div>{renderBar(ramUsage, 'var(--green)')}</div>
        <span style={{ color: 'var(--green)', fontWeight: 'bold', width: '42px', textAlign: 'right' }}>{ramUsage}%</span>
      </div>

      <div className="tui-row">
        <span style={{ color: 'var(--fg-dim)', width: '65px' }}>NVMe 512G</span>
        <div>{renderBar(28.4, 'var(--yellow)')}</div>
        <span style={{ color: 'var(--yellow)', fontWeight: 'bold', width: '42px', textAlign: 'right' }}>28.4%</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--fg-muted)', borderTop: '1px solid var(--border)', paddingTop: '2px' }}>
        <span>▲ TX: 4.2 MB/s</span>
        <span>▼ RX: 14.8 MB/s</span>
        <span className="pill green" style={{ fontSize: '8px', padding: '0 3px' }}>HEALTHY</span>
      </div>
    </div>
  );
};

export const ResourceUsageExpandedWorkbench: React.FC = () => {
  const [coreUsages, setCoreUsages] = useState([22, 35, 18, 42, 15, 28, 12, 19]);
  const [ramUsedGb, setRamUsedGb] = useState(3.42);
  const [processes, setProcesses] = useState<ProcessItem[]>(SAMPLE_PROCESSES);

  useEffect(() => {
    const interval = setInterval(() => {
      setCoreUsages(prev => prev.map(c => Math.min(99, Math.max(5, Math.round(c + (Math.random() * 12 - 6))))));
      setRamUsedGb(p => +(p + (Math.random() * 0.08 - 0.04)).toFixed(2));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const totalCpu = Math.round(coreUsages.reduce((a, b) => a + b, 0) / coreUsages.length);

  return (
    <div className="workbench-split">
      {/* Left Column: CPU & Memory Hardware */}
      <div className="workbench-left" style={{ padding: '6px', gap: '6px' }}>
        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
          CPU OCTA-CORE HARDWARE LOAD METRICS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {coreUsages.map((usage, idx) => (
            <div key={idx} style={{ background: '#020408', border: '1px solid var(--border)', padding: '4px 6px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span style={{ color: 'var(--fg-muted)' }}>CORE #{idx}</span>
                <span style={{ color: usage > 75 ? 'var(--red)' : usage > 50 ? 'var(--yellow)' : 'var(--cyan)', fontWeight: 'bold' }}>
                  {usage}%
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', background: '#080d1a', marginTop: '3px', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ width: `${usage}%`, height: '100%', background: usage > 75 ? 'var(--red)' : 'var(--cyan)', transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px', marginTop: '4px' }}>
          MEMORY & VIRTUAL SWAP PARTITIONS
        </div>

        <table className="tui-table">
          <tbody>
            <tr>
              <td style={{ color: 'var(--fg-muted)', width: '100px' }}>RAM TOTAL / USED</td>
              <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>{ramUsedGb} GB / 8.00 GB (42.8%)</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--fg-muted)' }}>ACTIVE CACHE</td>
              <td style={{ color: '#fff' }}>2.14 GB (OS Page Cache)</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--fg-muted)' }}>FREE BUFFER</td>
              <td style={{ color: 'var(--fg-dim)' }}>2.44 GB Available</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--fg-muted)' }}>SWAP PARTITION</td>
              <td style={{ color: 'var(--cyan)' }}>0.00 MB / 2048 MB (0% Utilized)</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px', marginTop: '4px' }}>
          FILESYSTEM MOUNT POINTS (NVMe)
        </div>
        <table className="tui-table">
          <thead>
            <tr>
              <th>FILESYSTEM</th>
              <th>MOUNT</th>
              <th>USED</th>
              <th>AVAIL</th>
              <th>CAP%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: 'var(--cyan)' }}>/dev/nvme0n1p2</td>
              <td style={{ color: '#fff' }}>/</td>
              <td>124.8G</td>
              <td>354.2G</td>
              <td style={{ color: 'var(--green)' }}>26%</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--cyan)' }}>/dev/nvme0n1p1</td>
              <td style={{ color: '#fff' }}>/boot/efi</td>
              <td>142.0M</td>
              <td>368.0M</td>
              <td style={{ color: 'var(--green)' }}>28%</td>
            </tr>
            <tr>
              <td style={{ color: 'var(--cyan)' }}>docker-overlay</td>
              <td style={{ color: '#fff' }}>/var/lib/docker</td>
              <td>28.4G</td>
              <td>450.0G</td>
              <td style={{ color: 'var(--green)' }}>6%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Right Column: Process Monitor & Network */}
      <div className="workbench-right" style={{ gap: '6px' }}>
        <div className="exp-metric-grid">
          <div className="exp-metric-box">
            <div className="exp-metric-label">TOTAL CPU LOAD</div>
            <div className="exp-metric-val" style={{ color: totalCpu > 60 ? 'var(--yellow)' : 'var(--cyan)' }}>
              {totalCpu}%
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">RAM ALLOCATED</div>
            <div className="exp-metric-val" style={{ color: 'var(--green)' }}>{ramUsedGb} GB</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">LOAD AVG (1/5/15m)</div>
            <div className="exp-metric-val" style={{ fontSize: '11px' }}>0.42, 0.38, 0.31</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">UPTIME</div>
            <div className="exp-metric-val">14d 08h 22m</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold' }}>
              TOP SYSTEM PROCESSES (CPU & RAM INTENSIVE)
            </div>
            <span style={{ fontSize: '8.5px', color: 'var(--fg-muted)' }}>6 Active Processes</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', background: '#020305', border: '1px solid var(--border)' }}>
            <table className="tui-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>PID</th>
                  <th style={{ width: '55px' }}>USER</th>
                  <th style={{ width: '45px' }}>CPU%</th>
                  <th style={{ width: '45px' }}>MEM%</th>
                  <th>COMMAND</th>
                  <th style={{ width: '25px' }}>ST</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(p => (
                  <tr key={p.pid}>
                    <td style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{p.pid}</td>
                    <td style={{ color: 'var(--fg-muted)' }}>{p.user}</td>
                    <td style={{ color: p.cpu > 5 ? 'var(--yellow)' : 'var(--fg)', fontWeight: 'bold' }}>{p.cpu}%</td>
                    <td style={{ color: p.mem > 10 ? 'var(--green)' : 'var(--fg)' }}>{p.mem}%</td>
                    <td style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{p.command}</td>
                    <td style={{ color: p.state === 'R' ? 'var(--green)' : 'var(--fg-muted)', fontWeight: 'bold' }}>{p.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', fontWeight: 'bold', marginBottom: '2px' }}>
            NETWORK INTERFACES BANDWIDTH
          </div>
          <table className="tui-table">
            <thead>
              <tr>
                <th>INTERFACE</th>
                <th>IP BINDING</th>
                <th>RX (DOWNLOAD)</th>
                <th>TX (UPLOAD)</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--cyan)' }}>eth0</td>
                <td>192.168.1.120</td>
                <td style={{ color: 'var(--green)' }}>14.8 MB/s (118 Mbps)</td>
                <td style={{ color: 'var(--cyan)' }}>4.2 MB/s (33.6 Mbps)</td>
                <td><span className="dot"></span>UP</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--cyan)' }}>docker0</td>
                <td>172.17.0.1</td>
                <td>2.4 MB/s</td>
                <td>2.4 MB/s</td>
                <td><span className="dot"></span>UP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
