import React, { useRef, useEffect } from 'react';
import { useTools } from '../../context/ToolsContext';
import { useDashboard } from '../../context/DashboardContext';
import { soundFx } from '../../services/soundFx';

export const CliTerminalWidget: React.FC = () => {
  const { termHistory, termInput, setTermInput, handleTermSubmit } = useTools();
  const termScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    termScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [termHistory]);

  return (
    <div className="term-box">
      <div className="term-stream">
        {termHistory.map((l, i) => (
          <div key={i} style={{ color: l.startsWith('000:~#') ? 'var(--cyan)' : l.includes('SUCCESS') ? 'var(--green)' : 'var(--fg)' }}>
            {l}
          </div>
        ))}
        <div ref={termScrollRef} />
      </div>
      <form onSubmit={handleTermSubmit} className="term-input-row">
        <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>000:~#</span>
        <input
          type="text"
          value={termInput}
          onChange={(e) => setTermInput(e.target.value)}
          placeholder="status, ping, defcon 1, deploy..."
          style={{ flex: 1, border: 'none', background: 'transparent' }}
        />
        <button type="submit">[↵]</button>
      </form>
    </div>
  );
};

export const CliExpandedWorkbench: React.FC = () => {
  const { termHistory, setTermHistory, termInput, setTermInput, handleTermSubmit } = useTools();
  const { setDefcon } = useDashboard();
  const termScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    termScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [termHistory]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', height: '100%', gap: '8px' }}>
      <div className="term-box">
        <div className="term-stream" style={{ flex: 1 }}>
          {termHistory.map((l, i) => (
            <div key={i} style={{ color: l.startsWith('000:~#') ? 'var(--cyan)' : l.includes('SUCCESS') ? 'var(--green)' : 'var(--fg)' }}>
              {l}
            </div>
          ))}
          <div ref={termScrollRef} />
        </div>
        <form onSubmit={handleTermSubmit} className="term-input-row">
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>000:~#</span>
          <input
            type="text"
            value={termInput}
            onChange={(e) => setTermInput(e.target.value)}
            placeholder="status, ping, defcon 1, deploy, clear..."
            style={{ flex: 1, border: 'none', background: 'transparent' }}
          />
          <button type="submit">[↵]</button>
        </form>
      </div>

      {/* Right Quick Runbook Macro Triggers */}
      <div style={{ background: '#04060a', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '9.5px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
          MACRO RUNBOOK TRIGGERS
        </div>
        <button className="btn-accent" onClick={() => {
          soundFx.playDeploySuccess();
          setTermHistory(p => [...p, '000:~# deploy staging', '[DEPLOY] Staging build triggered -> SUCCESS in 3.1s']);
        }}>⚡ Deploy Staging</button>

        <button onClick={() => {
          soundFx.playClick(900);
          setTermHistory(p => [...p, '000:~# cache flush --all', '[CACHE] 1,420 route objects invalidated']);
        }}>🔄 Flush CDN Cache</button>

        <button onClick={() => {
          soundFx.playClick(900);
          setTermHistory(p => [...p, '000:~# ping 000.localhost', 'PING 000.localhost: latency=8.1ms']);
        }}>📡 Synthetic Ping</button>

        <button onClick={() => {
          soundFx.playAlarm();
          setDefcon(1);
          setTermHistory(p => [...p, '000:~# defcon 1', '[ALERT] DEFCON 1 MAXIMUM LOCKDOWN ACTIVE']);
        }} style={{ color: 'var(--red)' }}>🚨 DEFCON 1 Lockdown</button>
      </div>
    </div>
  );
};
