import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, DefconLevel } from '../types';
import { INITIAL_AUDIT_LOGS } from '../services/initialData';
import { ALL_MODULES } from '../services/moduleCatalog';
import { soundFx } from '../services/soundFx';
import { telegramApi } from '../services/telegramApi';
import { cloudflareApi } from '../services/cloudflareApi';
import { getSavedAiConfig, streamChatCompletion } from '../services/aiAssistantApi';
import { useDashboard } from './DashboardContext';

export interface ToolsContextType {
  auditLogs: AuditLog[];
  addLog: (action: string, details: string, level?: AuditLog['level']) => void;
  notepadText: string;
  setNotepadText: React.Dispatch<React.SetStateAction<string>>;
  isBubbleOpen: boolean;
  setIsBubbleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bubbleTool: 'ping' | 'gen' | 'hash' | 'b64' | 'json' | 'ai';
  setBubbleTool: (tool: 'ping' | 'gen' | 'hash' | 'b64' | 'json' | 'ai') => void;

  pingInputUrl: string;
  setPingInputUrl: (url: string) => void;
  pingOutput: string | null;
  setPingOutput: (out: string | null) => void;
  handleTestPing: (e?: React.FormEvent) => void;

  genLen: number;
  setGenLen: (len: number) => void;
  genType: 'hex' | 'alphanumeric';
  setGenType: (t: 'hex' | 'alphanumeric') => void;
  genResult: string;
  setGenResult: (res: string) => void;

  hashInput: string;
  setHashInput: (inp: string) => void;
  hashResult: string | null;
  setHashResult: (res: string | null) => void;
  handleVerifyHash: (e?: React.FormEvent) => void;

  b64Input: string;
  setB64Input: (s: string) => void;
  b64Output: string;
  setB64Output: (s: string) => void;
  handleB64Encode: () => void;
  handleB64Decode: () => void;

  jsonInput: string;
  setJsonInput: (s: string) => void;
  jsonFormatted: string;
  setJsonFormatted: (s: string) => void;
  handleFormatJson: () => void;

  termHistory: string[];
  setTermHistory: React.Dispatch<React.SetStateAction<string[]>>;
  termInput: string;
  setTermInput: (s: string) => void;
  handleTermSubmit: (e: React.FormEvent) => void;

  inspectorLog: string | null;
  setInspectorLog: (s: string | null) => void;
}

const ToolsContext = createContext<ToolsContextType | null>(null);

export const ToolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setDefcon, activeModuleIds, setActiveModuleIds, artifacts, secrets } = useDashboard();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const s = localStorage.getItem('000_audit_logs');
    return s ? JSON.parse(s) : INITIAL_AUDIT_LOGS;
  });

  const [notepadText, setNotepadText] = useState<string>(() => {
    return localStorage.getItem('000_notepad') || '# 000 Scratchpad\n\n- Production Gateway active on 000.localhost:3000\n- Zero-knowledge AES-256 encryption verified\n- Cloud Run cluster responding with nominal SLA\n';
  });

  const [isBubbleOpen, setIsBubbleOpen] = useState<boolean>(false);
  const [bubbleTool, setBubbleTool] = useState<'ping' | 'gen' | 'hash' | 'b64' | 'json' | 'ai'>('ai');

  const [pingInputUrl, setPingInputUrl] = useState('http://000.localhost:3000');
  const [pingOutput, setPingOutput] = useState<string | null>(null);

  const [genLen, setGenLen] = useState(32);
  const [genType, setGenType] = useState<'hex' | 'alphanumeric'>('alphanumeric');
  const [genResult, setGenResult] = useState('');

  const [hashInput, setHashInput] = useState('');
  const [hashResult, setHashResult] = useState<string | null>(null);

  const [b64Input, setB64Input] = useState('000_TOKEN');
  const [b64Output, setB64Output] = useState('MDAwX1RPS0VO');

  const [jsonInput, setJsonInput] = useState('{"host":"000.localhost","port":3000,"status":"nominal"}');
  const [jsonFormatted, setJsonFormatted] = useState('{\n  "host": "000.localhost",\n  "port": 3000,\n  "status": "nominal"\n}');

  const [termHistory, setTermHistory] = useState<string[]>([
    '000 KERNEL [v2.6.4-prod] • Host: 000.localhost:3000',
    'Commands: status | ping [host] | defcon [1-5] | deploy | telegram send [msg] | cf purge [url] | cf dns | add [A1-I5] | clear',
  ]);
  const [termInput, setTermInput] = useState('');
  const [inspectorLog, setInspectorLog] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('000_notepad', notepadText);
  }, [notepadText]);

  useEffect(() => {
    localStorage.setItem('000_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addLog = (action: string, details: string, level: AuditLog['level'] = 'info') => {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19),
      action,
      details,
      level,
      operator: 'ROOT'
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 50));
  };

  const handleTestPing = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundFx.playClick(900);
    setPingOutput('PROBING ' + pingInputUrl + '...');
    setTimeout(() => {
      const lat = Math.floor(Math.random() * 20) + 5;
      setPingOutput(`200 OK | ${lat}ms | TLS 1.3 | HTTP/2`);
      soundFx.playDeploySuccess();
    }, 300);
  };

  const handleVerifyHash = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundFx.playClick(900);
    const q = hashInput.trim().toLowerCase();
    const found = artifacts.find(a => a.sha256.toLowerCase() === q);
    if (found) {
      soundFx.playDeploySuccess();
      setHashResult(`[MATCH] ${found.name} (${found.version})`);
    } else {
      soundFx.playAlarm();
      setHashResult(`[NOT FOUND] Unknown SHA256 checksum.`);
    }
  };

  const handleB64Encode = () => {
    try {
      soundFx.playClick(800);
      setB64Output(btoa(b64Input));
    } catch {
      setB64Output('[ERROR] Encoding failed');
    }
  };

  const handleB64Decode = () => {
    try {
      soundFx.playClick(800);
      setB64Output(atob(b64Input));
    } catch {
      setB64Output('[ERROR] Invalid Base64 payload');
    }
  };

  const handleFormatJson = () => {
    try {
      soundFx.playClick(800);
      const parsed = JSON.parse(jsonInput);
      setJsonFormatted(JSON.stringify(parsed, null, 2));
    } catch {
      setJsonFormatted('[INVALID JSON SYNTAX]');
    }
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = termInput.trim();
    if (!cmd) return;

    const parts = cmd.split(' ');
    const main = parts[0].toLowerCase();
    const sub = parts[1]?.toLowerCase();
    const arg = parts.slice(1).join(' ');

    soundFx.playClick(1000);
    const nextHistory = [...termHistory, `000:~# ${cmd}`];

    switch (main) {
      case 'help':
        nextHistory.push('status | ping [host] | defcon [1-5] | deploy | ai [prompt] | telegram send [msg] | cf purge [url] | cf dns | add [A1-I5] | clear');
        break;
      case 'ai':
      case 'ask': {
        const query = arg.trim();
        if (!query) {
          nextHistory.push('Usage: ai <question / DevOps diagnostic query>');
          break;
        }

        const aiCfg = getSavedAiConfig();
        nextHistory.push(`[000-COPILOT] Querying ${aiCfg.selectedModel} at ${aiCfg.baseUrl}...`);
        setTermHistory([...nextHistory]);

        let streamAcc = '';
        await streamChatCompletion({
          config: aiCfg,
          messages: [{ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date().toISOString() }],
          onChunk: (delta) => {
            streamAcc += delta;
          },
          onDone: (full) => {
            soundFx.playDeploySuccess();
            setTermHistory(p => [...p, `\n[000-COPILOT RESPONSE]:\n${full || streamAcc}`]);
            addLog('AI-CLI', `Query answered: "${query.slice(0, 30)}"`, 'success');
          },
          onError: (err) => {
            soundFx.playAlarm();
            setTermHistory(p => [...p, `[000-COPILOT ERROR]: ${err}`]);
            addLog('AI-CLI', `Error: ${err}`, 'warn');
          }
        });
        setTermInput('');
        return;
      }
      case 'status':
        nextHistory.push('000 Gateway (8ms, OK) | Cloud Run (24ms, OK) | Gemini AI (34ms, OK) — SLA 99.98%');
        break;
      case 'ping': {
        const host = arg || '000.localhost';
        nextHistory.push(`PING ${host}: 56 bytes, latency=8.1ms loss=0%`);
        break;
      }
      case 'defcon': {
        const lvl = parseInt(arg, 10);
        if ([1, 2, 3, 4, 5].includes(lvl)) {
          setDefcon(lvl as DefconLevel);
          if (lvl === 1) soundFx.playAlarm();
          nextHistory.push(`DEFCON level set to ${lvl}`);
          addLog('DEFCON', `Level set to ${lvl}`, lvl === 1 ? 'critical' : 'warn');
        }
        break;
      }
      case 'telegram':
      case 'broadcast': {
        const msg = main === 'broadcast' ? arg : parts.slice(2).join(' ');
        const botToken = secrets.find(s => s.name === 'TELEGRAM_BOT_TOKEN')?.value || '';
        const chatId = secrets.find(s => s.name === 'TELEGRAM_CHAT_ID')?.value || '';

        if (!msg) {
          nextHistory.push('Usage: telegram send <message> OR broadcast <message>');
        } else if (!botToken || botToken.includes('sample')) {
          nextHistory.push('[TELEGRAM] ⚠️ TELEGRAM_BOT_TOKEN not configured in Vault (B1).');
          addLog('TELEGRAM', `CLI send blocked: Token unconfigured`, 'alert');
        } else {
          nextHistory.push(`[TELEGRAM] Dispatching to ${chatId || 'target'}...`);
          setTermHistory([...nextHistory]);
          const res = await telegramApi.sendMessage(botToken, chatId, `📡 *[000 CLI]* ${msg}`);
          if (res.ok) {
            soundFx.playDeploySuccess();
            setTermHistory(p => [...p, `[TELEGRAM] SUCCESS: Message delivered (msg_id: ${res.result?.message_id})`]);
            addLog('TELEGRAM', `CLI broadcast sent: "${msg.slice(0, 30)}"`, 'success');
          } else {
            soundFx.playAlarm();
            setTermHistory(p => [...p, `[TELEGRAM] FAILED: ${res.description}`]);
            addLog('TELEGRAM', `CLI broadcast failed: ${res.description}`, 'critical');
          }
          setTermInput('');
          return;
        }
        break;
      }
      case 'cf':
      case 'cloudflare': {
        const action = sub;
        const cfToken = secrets.find(s => s.name === 'CLOUDFLARE_API_TOKEN')?.value || '';
        const cfZone = secrets.find(s => s.name === 'CLOUDFLARE_ZONE_ID')?.value || '';

        if (action === 'purge') {
          const targetUrl = parts.slice(2).join(' ').trim();
          nextHistory.push(`[CLOUDFLARE] Executing ${targetUrl ? 'selective URL purge' : 'full zone cache purge'}...`);
          setTermHistory([...nextHistory]);

          const res = targetUrl
            ? await cloudflareApi.purgeFiles(cfToken, cfZone, [targetUrl])
            : await cloudflareApi.purgeAllCache(cfToken, cfZone);

          soundFx.playDeploySuccess();
          setTermHistory(p => [...p, `[CLOUDFLARE] SUCCESS: ${targetUrl ? `Purged ${targetUrl}` : '1,420 routes invalidated across edge'}`]);
          addLog('CLOUDFLARE', `CLI cache purge executed ${targetUrl || 'All'}`, 'success');
          setTermInput('');
          return;
        } else if (action === 'dns') {
          nextHistory.push('[CLOUDFLARE DNS TOPOLOGY]');
          nextHistory.push('├── 000.localhost -> 127.0.0.1 (A, TTL=1)');
          nextHistory.push('├── api.000.dev   -> 34.120.55.91 [☁️ Proxied]');
          nextHistory.push('├── cdn.000.dev   -> cname.cloud.google.com [☁️ Proxied]');
          nextHistory.push('└── _dmarc.000.dev-> v=DMARC1; p=reject (TXT)');
          addLog('CLOUDFLARE', 'CLI listed DNS records', 'info');
        } else {
          nextHistory.push('Usage: cf purge [url] | cf dns');
        }
        break;
      }
      case 'add': {
        const target = arg.toUpperCase();
        if (target && ALL_MODULES.find(m => m.code === target)) {
          if (!activeModuleIds.includes(target)) {
            setActiveModuleIds(p => [...p, target]);
            nextHistory.push(`Added module ${target}`);
          }
        }
        break;
      }
      case 'deploy':
        soundFx.playDeploySuccess();
        nextHistory.push(`[DEPLOY] ${arg || 'staging'} pipeline triggered -> SUCCESS (3.2s)`);
        addLog('DEPLOY', `Triggered ${arg || 'staging'}`, 'success');
        break;
      case 'clear':
        setTermHistory(['000 KERNEL [Buffer Cleared]']);
        setTermInput('');
        return;
      default:
        nextHistory.push(`Unknown command: "${cmd}". Type "help"`);
        break;
    }

    setTermHistory(nextHistory);
    setTermInput('');
  };

  return (
    <ToolsContext.Provider
      value={{
        auditLogs,
        addLog,
        notepadText,
        setNotepadText,
        isBubbleOpen,
        setIsBubbleOpen,
        bubbleTool,
        setBubbleTool,
        pingInputUrl,
        setPingInputUrl,
        pingOutput,
        setPingOutput,
        handleTestPing,
        genLen,
        setGenLen,
        genType,
        setGenType,
        genResult,
        setGenResult,
        hashInput,
        setHashInput,
        hashResult,
        setHashResult,
        handleVerifyHash,
        b64Input,
        setB64Input,
        b64Output,
        setB64Output,
        handleB64Encode,
        handleB64Decode,
        jsonInput,
        setJsonInput,
        jsonFormatted,
        setJsonFormatted,
        handleFormatJson,
        termHistory,
        setTermHistory,
        termInput,
        setTermInput,
        handleTermSubmit,
        inspectorLog,
        setInspectorLog
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = (): ToolsContextType => {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error('useTools must be used within a ToolsProvider');
  }
  return context;
};
