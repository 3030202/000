import React, { useState, useEffect, useRef } from 'react';
import { useTools } from '../../context/ToolsContext';
import { soundFx } from '../../services/soundFx';

interface DockerContainerItem {
  id: string;
  name: string;
  image: string;
  tag: string;
  status: 'running' | 'healthy' | 'stopped' | 'restarting';
  ports: string;
  memUsage: string;
  cpuPercent: number;
  uptime: string;
  restartCount: number;
  logs: string[];
}

const INITIAL_CONTAINERS: DockerContainerItem[] = [
  {
    id: 'c-01',
    name: '000_app',
    image: '000-mission-control-app',
    tag: 'v2.6.4-prod',
    status: 'healthy',
    ports: '80/tcp',
    memUsage: '22.4 MB',
    cpuPercent: 0.8,
    uptime: 'Up 14 days',
    restartCount: 0,
    logs: [
      '[INFO] 10:20:12 Nginx/1.27.0 runtime engine started on port 80',
      '[INFO] 10:20:12 Static asset bundle initialized in /usr/share/nginx/html',
      '[INFO] 10:21:00 GET / 200 OK (0.4ms) - Mozilla/5.0 (Windows NT 10.0)',
      '[INFO] 10:21:00 GET /assets/index-CWGk8KrF.js 200 OK (1.2ms) [GZIP]',
      '[HEALTHCHECK] 10:21:30 GET / 200 OK (0.2ms) - container healthy',
      '[INFO] 10:22:00 GET /api/status 200 OK (0.8ms) - Nominal SLA',
      '[HEALTHCHECK] 10:22:30 GET / 200 OK (0.2ms) - container healthy'
    ]
  },
  {
    id: 'c-02',
    name: '000_caddy',
    image: 'caddy',
    tag: '2.8-alpine',
    status: 'healthy',
    ports: '0.0.0.0:80->80, 0.0.0.0:443->443',
    memUsage: '34.8 MB',
    cpuPercent: 1.2,
    uptime: 'Up 14 days',
    restartCount: 0,
    logs: [
      '[INFO] 10:20:10 Caddy environment: DOMAIN_NAME=000.localhost',
      '[INFO] 10:20:10 Automatic HTTPS is enabled for 000.localhost',
      '[INFO] 10:20:11 [tls.cache] Certificate loaded for 000.localhost',
      '[INFO] 10:20:11 Serving HTTP on :80 and HTTPS on :443 (HTTP/3 enabled)',
      '[INFO] 10:21:00 "GET https://000.localhost/" 200 OK -> upstream 000_app:80',
      '[INFO] 10:22:04 "POST https://000.localhost/api/cache/purge" 200 OK (12ms)'
    ]
  },
  {
    id: 'c-03',
    name: 'postgres_master',
    image: 'postgres',
    tag: '16.4-alpine',
    status: 'running',
    ports: '127.0.0.1:5432->5432',
    memUsage: '142.5 MB',
    cpuPercent: 2.4,
    uptime: 'Up 14 days',
    restartCount: 0,
    logs: [
      '[LOG] 10:20:00 PostgreSQL 16.4 database system initialized',
      '[LOG] 10:20:00 SSL connections enabled with custom server.crt',
      '[LOG] 10:20:01 WAL checkpoint starting: time',
      '[LOG] 10:20:02 WAL checkpoint complete: 34 files written',
      '[LOG] 10:21:15 statement: SELECT * FROM secrets_vault WHERE active=true'
    ]
  },
  {
    id: 'c-04',
    name: 'redis_cache',
    image: 'redis',
    tag: '7.2-alpine',
    status: 'running',
    ports: '127.0.0.1:6379->6379',
    memUsage: '18.2 MB',
    cpuPercent: 0.4,
    uptime: 'Up 14 days',
    restartCount: 0,
    logs: [
      '[LOG] 10:20:00 Running in standalone mode on port 6379',
      '[LOG] 10:20:00 Memory limit: 256mb maxmemory-policy: allkeys-lru',
      '[LOG] 10:21:40 DB 0: 1,420 keys (0 volatile) in 256 hash buckets'
    ]
  },
  {
    id: 'c-05',
    name: 'gemini_agent',
    image: 'gemini-agent-service',
    tag: 'v1.4.2',
    status: 'healthy',
    ports: '127.0.0.1:8080->8080',
    memUsage: '84.0 MB',
    cpuPercent: 1.8,
    uptime: 'Up 12 days',
    restartCount: 0,
    logs: [
      '[INFO] 10:20:05 Gemini Multi-Agent reasoning engine initialized',
      '[INFO] 10:20:05 BigQuery Vector Store connected (latency: 34ms)',
      '[INFO] 10:21:50 Agent execution complete: query processed in 1.4s'
    ]
  }
];

export const DockerContainersWidget: React.FC = () => {
  const [containers] = useState<DockerContainerItem[]>(INITIAL_CONTAINERS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pill green">● 5 CONTAINERS RUNNING</span>
        <span style={{ fontSize: '8.5px', color: 'var(--fg-muted)' }}>DOCKER ENGINE v27.1</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="tui-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>IMAGE:TAG</th>
              <th>RAM</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {containers.map(c => (
              <tr key={c.id}>
                <td style={{ color: '#fff', fontWeight: 'bold' }}>{c.name}</td>
                <td style={{ color: 'var(--fg-dim)', fontFamily: 'monospace' }}>{c.tag}</td>
                <td style={{ color: 'var(--cyan)' }}>{c.memUsage}</td>
                <td>
                  <span className="dot"></span>
                  <span style={{ color: 'var(--green)' }}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DockerExpandedWorkbench: React.FC = () => {
  const { addLog } = useTools();

  const [containers, setContainers] = useState<DockerContainerItem[]>(INITIAL_CONTAINERS);
  const [selectedId, setSelectedId] = useState<string>('c-01');
  const [filterText, setFilterText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'logs' | 'inspect' | 'cli'>('logs');
  const [isRestarting, setIsRestarting] = useState<boolean>(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const selectedContainer = containers.find(c => c.id === selectedId) || containers[0];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContainer.logs]);

  const handleRestart = (c: DockerContainerItem) => {
    soundFx.playClick(900);
    setIsRestarting(true);

    setTimeout(() => {
      soundFx.playDeploySuccess();
      const timeStr = new Date().toISOString().substring(11, 19);
      const newLog = `[RESTART] ${timeStr} Container ${c.name} graceful restart complete (exit code 0)`;

      setContainers(prev => prev.map(item => {
        if (item.id === c.id) {
          return {
            ...item,
            status: 'healthy',
            restartCount: item.restartCount + 1,
            logs: [...item.logs, newLog, `[INFO] ${timeStr} Listening on ports ${item.ports}`]
          };
        }
        return item;
      }));

      setIsRestarting(false);
      addLog('DOCKER', `Restarted container ${c.name}`, 'success');
    }, 600);
  };

  const handleToggleState = (c: DockerContainerItem) => {
    soundFx.playClick(900);
    const isStopping = c.status !== 'stopped';

    if (isStopping) {
      soundFx.playLock();
      addLog('DOCKER', `Stopped container ${c.name}`, 'warn');
    } else {
      soundFx.playDeploySuccess();
      addLog('DOCKER', `Started container ${c.name}`, 'success');
    }

    setContainers(prev => prev.map(item => {
      if (item.id === c.id) {
        return {
          ...item,
          status: isStopping ? 'stopped' : 'healthy',
          logs: [...item.logs, `[STATE] Container ${isStopping ? 'SIGTERM stop' : 'started OK'}`]
        };
      }
      return item;
    }));
  };

  const filteredContainers = containers.filter(c => 
    c.name.toLowerCase().includes(filterText.toLowerCase()) || 
    c.image.toLowerCase().includes(filterText.toLowerCase()) ||
    c.tag.toLowerCase().includes(filterText.toLowerCase())
  );

  const inspectJson = {
    Id: `sha256:89a0b1c2d3e4f50123456789abcdef0123456789abcdef${selectedContainer.id}`,
    Created: '2026-08-16T10:20:00.000Z',
    Path: selectedContainer.name.includes('app') ? 'nginx' : selectedContainer.name.includes('caddy') ? 'caddy' : 'entrypoint.sh',
    Args: ['-g', 'daemon off;'],
    State: {
      Status: selectedContainer.status,
      Running: selectedContainer.status !== 'stopped',
      RestartCount: selectedContainer.restartCount,
      Health: { Status: 'healthy', FailingStreak: 0 }
    },
    Image: `${selectedContainer.image}:${selectedContainer.tag}`,
    NetworkSettings: {
      Bridge: '000-net',
      IPAddress: `172.20.0.${selectedContainer.id.slice(-1)}`,
      Ports: selectedContainer.ports
    },
    HostConfig: {
      RestartPolicy: { Name: 'unless-stopped' },
      MemoryLimit: selectedContainer.memUsage
    }
  };

  return (
    <div className="workbench-split">
      {/* Left Column: Container Registry & Actions */}
      <div className="workbench-left" style={{ padding: '6px', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
          <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold' }}>
            DOCKER CONTAINER CONTROLLER & REGISTRY
          </div>
          <span style={{ fontSize: '8.5px', color: 'var(--fg-muted)' }}>
            {containers.filter(c => c.status !== 'stopped').length}/{containers.length} Running
          </span>
        </div>

        <input
          type="text"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter containers (app, caddy, postgres)..."
          style={{ width: '100%', fontSize: '9.5px' }}
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="tui-table">
            <thead>
              <tr>
                <th>CONTAINER</th>
                <th>IMAGE</th>
                <th>PORTS</th>
                <th>MEM</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredContainers.map(c => {
                const isSel = c.id === selectedId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => { soundFx.playClick(900); setSelectedId(c.id); }}
                    style={{ background: isSel ? 'rgba(56, 189, 248, 0.12)' : undefined, cursor: 'pointer' }}
                  >
                    <td style={{ color: isSel ? 'var(--cyan)' : '#fff', fontWeight: 'bold' }}>
                      <span className={`dot ${c.status === 'stopped' ? 'red' : ''}`}></span>
                      {c.name}
                    </td>
                    <td style={{ color: 'var(--fg-dim)', fontFamily: 'monospace' }}>{c.image}:{c.tag}</td>
                    <td style={{ color: 'var(--fg-muted)', fontSize: '8.5px' }}>{c.ports}</td>
                    <td style={{ color: 'var(--cyan)' }}>{c.memUsage}</td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestart(c); }}
                        disabled={isRestarting}
                        style={{ fontSize: '8px', padding: '0 3px' }}
                      >
                        [Restart]
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <button
            className="btn-accent"
            onClick={() => handleRestart(selectedContainer)}
            disabled={isRestarting}
            style={{ flex: 1 }}
          >
            {isRestarting ? 'Restarting...' : `🔄 Restart ${selectedContainer.name}`}
          </button>
          <button
            onClick={() => handleToggleState(selectedContainer)}
            style={{ color: selectedContainer.status === 'stopped' ? 'var(--green)' : 'var(--red)' }}
          >
            {selectedContainer.status === 'stopped' ? '▶ Start' : '⏹ Stop'}
          </button>
        </div>
      </div>

      {/* Right Column: Streaming Logs & Inspect */}
      <div className="workbench-right" style={{ gap: '6px' }}>
        <div className="exp-metric-grid">
          <div className="exp-metric-box">
            <div className="exp-metric-label">ACTIVE CONTAINER</div>
            <div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{selectedContainer.name}</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">CONTAINER STATE</div>
            <div className="exp-metric-val" style={{ color: selectedContainer.status === 'stopped' ? 'var(--red)' : 'var(--green)', textTransform: 'uppercase' }}>
              {selectedContainer.status}
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">MEMORY USAGE</div>
            <div className="exp-metric-val">{selectedContainer.memUsage}</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">UPTIME</div>
            <div className="exp-metric-val" style={{ fontSize: '11px' }}>{selectedContainer.uptime}</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
          <button
            className={activeTab === 'logs' ? 'btn-accent' : ''}
            onClick={() => setActiveTab('logs')}
            style={{ fontSize: '9px' }}
          >
            📜 Live Streaming Logs
          </button>
          <button
            className={activeTab === 'inspect' ? 'btn-accent' : ''}
            onClick={() => setActiveTab('inspect')}
            style={{ fontSize: '9px' }}
          >
            🔍 Docker Inspect JSON
          </button>
          <button
            className={activeTab === 'cli' ? 'btn-accent' : ''}
            onClick={() => setActiveTab('cli')}
            style={{ fontSize: '9px' }}
          >
            ⌨️ CLI Runbook
          </button>
        </div>

        {/* Tab 1: Live Logs */}
        {activeTab === 'logs' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '140px' }}>
            <div style={{ flex: 1, background: '#020305', border: '1px solid var(--border)', padding: '6px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9.5px', lineHeight: '1.4' }}>
              {selectedContainer.logs.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    color: line.includes('[ERROR]') || line.includes('[FAIL]')
                      ? 'var(--red)'
                      : line.includes('[HEALTHCHECK]') || line.includes('[RESTART]')
                      ? 'var(--green)'
                      : line.includes('[WARN]')
                      ? 'var(--yellow)'
                      : 'var(--fg)'
                  }}
                >
                  {line}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {/* Tab 2: Inspect JSON */}
        {activeTab === 'inspect' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '140px' }}>
            <pre style={{ flex: 1, background: '#020305', border: '1px solid var(--border)', padding: '6px', overflow: 'auto', color: 'var(--cyan)', fontSize: '9.5px', lineHeight: '1.3' }}>
              {JSON.stringify(inspectJson, null, 2)}
            </pre>
          </div>
        )}

        {/* Tab 3: CLI Snippets */}
        {activeTab === 'cli' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '140px' }}>
            <div style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>EQUIVALENT DOCKER COMMANDS</div>
            <pre style={{ background: '#000', border: '1px solid var(--border)', padding: '6px', color: 'var(--green)', fontSize: '9.5px', lineHeight: '1.4' }}>
{`# View container logs
docker logs -f ${selectedContainer.name}

# Restart container
docker restart ${selectedContainer.name}

# Inspect low-level container info
docker inspect ${selectedContainer.name}

# Execute interactive shell inside container
docker exec -it ${selectedContainer.name} sh`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
