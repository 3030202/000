import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Clock, 
  CornerDownLeft, 
  Sliders, 
  FileText,
  Trash2,
  Lock,
  Download
} from 'lucide-react';
import { QuickAction, AuditLog, DefconLevel } from '../types';
import { soundFx } from '../services/soundFx';

interface QuickOpsPanelProps {
  actions: QuickAction[];
  auditLogs: AuditLog[];
  defcon: DefconLevel;
  setDefcon: (level: DefconLevel) => void;
  onExecuteAction: (action: QuickAction) => void;
  onAddAuditLog: (log: Omit<AuditLog, 'id'>) => void;
}

export const QuickOpsPanel: React.FC<QuickOpsPanelProps> = ({
  actions,
  auditLogs,
  defcon,
  setDefcon,
  onExecuteAction,
  onAddAuditLog
}) => {
  // Terminal Emulator State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '000 MISSION CONTROL KERNEL [Version 2.6.4-prod]',
    'Type "help" to view available ops commands.',
    'System initialized on host 000.localhost:3000. All telemetry nominal.',
    '----------------------------------------------------------------------'
  ]);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);

  const termBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    termBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    soundFx.playClick(1000);
    const newLogs = [...terminalHistory, `root@000-control:~# ${cmd}`];

    switch (mainCmd) {
      case 'help':
        newLogs.push(
          'Available Commands:',
          '  status        - Print overall system health and node status',
          '  ping <host>   - Send synthetic low-latency ICMP ping probe',
          '  defcon <1-5>  - Switch global defense & alert posture',
          '  vault         - Inspect cryptographic vault key state',
          '  matrix        - Stream cyber matrix rain diagnostics',
          '  deploy <env>  - Dispatch automated build pipeline',
          '  clear         - Clear terminal buffer',
          '  uptime        - Print operational gateway uptime'
        );
        break;

      case 'status':
        newLogs.push(
          'NODE TELEMETRY AUDIT:',
          '  • 000 Gateway (000.localhost:3000) -> 8ms [ONLINE]',
          '  • Cloud Run API Cluster             -> 24ms [ONLINE]',
          '  • Gemini AI Realtime Live API       -> 34ms [ONLINE]',
          '  • Cloud SQL PostgreSQL Replica      -> 14ms [ONLINE]',
          '  • Overall Health: 100% NOMINAL'
        );
        onAddAuditLog({
          timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
          level: 'info',
          action: 'CLI_STATUS_CHECK',
          details: 'User executed status diagnostic probe from CLI terminal.',
          operator: 'CLI_ROOT'
        });
        break;

      case 'ping':
        const target = arg || '000.localhost';
        newLogs.push(
          `PING ${target} (127.0.0.1): 56 data bytes`,
          `64 bytes from ${target}: icmp_seq=0 ttl=64 time=8.14 ms`,
          `64 bytes from ${target}: icmp_seq=1 ttl=64 time=7.82 ms`,
          `--- ${target} ping statistics ---`,
          `2 packets transmitted, 2 received, 0% packet loss, rtt avg = 7.98 ms`
        );
        soundFx.playDeploySuccess();
        break;

      case 'defcon':
        const lvl = parseInt(arg, 10);
        if ([1, 2, 3, 4, 5].includes(lvl)) {
          setDefcon(lvl as DefconLevel);
          if (lvl === 1) soundFx.playAlarm();
          else soundFx.playDeploySuccess();
          newLogs.push(`[DEFCON ALERT] Global system posture switched to LEVEL ${lvl}`);
          onAddAuditLog({
            timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
            level: lvl === 1 ? 'critical' : 'warn',
            action: 'DEFCON_CHANGE',
            details: `DEFCON level updated to ${lvl} via CLI terminal.`,
            operator: 'CLI_ROOT'
          });
        } else {
          newLogs.push('Error: Invalid DEFCON level. Use: defcon 1 | 2 | 3 | 4 | 5');
        }
        break;

      case 'matrix':
        soundFx.playUnlock();
        newLogs.push(
          '10101010101010101010101010101010101010101010101010101010101010',
          '01010100 01001000 01000101 00100000 01001101 01000001 01010100',
          '01010010 01001001 01011000 00100000 01001000 01000001 01010011',
          '00100000 01011001 01001111 01010101 00100000 00101110 00101110',
          '>>> ACCESS GRANTED: 000 COMMAND DECK OPERATIONAL <<<'
        );
        break;

      case 'vault':
        newLogs.push(
          'VAULT ENCRYPTION STATUS:',
          '  Algorithm: AES-GCM 256-bit',
          '  Key Derivation: PBKDF2 (100,000 iterations, SHA-256)',
          '  Zero-Knowledge Client Storage: ACTIVE',
          '  Auto-Lock Watchdog: ENABLED'
        );
        break;

      case 'deploy':
        soundFx.playDeploySuccess();
        newLogs.push(
          `[PIPELINE] Triggering automated build pipeline for [${arg || 'staging'}]...`,
          `[PIPELINE] Building Docker image tag sha-${Math.random().toString(16).substring(2, 8)}...`,
          `[PIPELINE] Deploying to Cloud Run region us-central1...`,
          `[SUCCESS] Deployment complete in 4.2s. Live at http://000.localhost:3000`
        );
        onAddAuditLog({
          timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
          level: 'success',
          action: 'DEPLOY_PIPELINE',
          details: `Manual pipeline dispatch triggered for target: ${arg || 'staging'}.`,
          operator: 'CLI_ROOT'
        });
        break;

      case 'uptime':
        newLogs.push('Gateway Uptime: 99.98% (24 days, 14 hours, 32 mins)');
        break;

      case 'clear':
        setTerminalHistory(['000 MISSION CONTROL KERNEL [Buffer Cleared]']);
        setTerminalInput('');
        return;

      default:
        newLogs.push(`Command not recognized: "${cmd}". Type "help" for valid commands.`);
        break;
    }

    setTerminalHistory(newLogs);
    setTerminalInput('');
  };

  const handleRunAction = (action: QuickAction) => {
    soundFx.playClick(900);
    setRunningActionId(action.id);

    setTimeout(() => {
      soundFx.playDeploySuccess();
      setRunningActionId(null);
      onExecuteAction(action);
      onAddAuditLog({
        timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
        level: 'success',
        action: action.category.toUpperCase().replace(/\s+/g, '_'),
        details: `Successfully executed: ${action.title}`,
        operator: 'OPS_PANEL'
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,254,0.2)]">
            <TerminalIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              OPS AUTOMATION & CLI COMMAND DECK
            </h2>
            <p className="text-xs text-slate-400">
              Runbook dispatchers, instant webhooks, and live terminal shell emulator.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-slate-400">
          <span>HOST: <strong className="text-cyan-300">000.localhost:3000</strong></span>
        </div>
      </div>

      {/* Pre-configured Quick Action Cards */}
      <div>
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
          Automated Runbooks & Webhooks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((act) => {
            const isRunning = runningActionId === act.id;

            return (
              <div
                key={act.id}
                className="glass-panel hover:bg-slate-900/80 p-4 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all flex items-start justify-between gap-4 shadow-sm"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm font-heading">{act.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {act.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{act.description}</p>
                  {act.commandSnippet && (
                    <div className="bg-black/60 p-1.5 rounded text-[10px] font-mono text-cyan-200 truncate mt-2">
                      {act.commandSnippet}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRunAction(act)}
                  disabled={isRunning}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition shrink-0 shadow-md"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Execute'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive CLI Terminal Shell */}
      <div className="glass-panel rounded-2xl border border-cyan-500/40 overflow-hidden shadow-2xl bg-[#06080e]">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <span className="text-slate-400 pl-2">000-shell // root@mission-control</span>
          </div>

          <button
            onClick={() => setTerminalHistory(['000 MISSION CONTROL KERNEL [Buffer Cleared]'])}
            className="text-slate-500 hover:text-slate-300 flex items-center space-x-1 text-[11px]"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Terminal Output */}
        <div className="p-4 font-mono text-xs space-y-1 h-64 overflow-y-auto text-slate-300 select-text">
          {terminalHistory.map((line, idx) => (
            <div 
              key={idx} 
              className={line.startsWith('root@') ? 'text-cyan-300 font-bold' : line.includes('[DEFCON') ? 'text-rose-400 font-bold' : line.includes('[SUCCESS]') ? 'text-emerald-300' : 'text-slate-300'}
            >
              {line}
            </div>
          ))}
          <div ref={termBottomRef} />
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleTerminalSubmit} className="flex items-center px-4 py-2.5 bg-slate-950 border-t border-white/10">
          <span className="text-cyan-400 font-mono text-xs font-bold mr-2">root@000-control:~#</span>
          <input
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            placeholder="Type 'help', 'status', 'ping', 'defcon 1', 'deploy prod'..."
            className="w-full bg-transparent text-xs text-white font-mono placeholder-slate-600 focus:outline-none"
          />
          <button type="submit" className="text-slate-400 hover:text-cyan-300 p-1">
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Audit Log Stream */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-time System Audit & Event Ledger</span>
        </h4>

        <div className="space-y-2">
          {auditLogs.slice(0, 5).map((log) => {
            const isCrit = log.level === 'critical';
            const isWarn = log.level === 'warn';
            const isSuccess = log.level === 'success';

            return (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 font-mono text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center space-x-2 min-w-0 truncate">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                    isCrit ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    isWarn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-slate-300 truncate">{log.details}</span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-500 shrink-0">
                  <span>{log.operator}</span>
                  <span>•</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
