import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useVault } from '../../context/VaultContext';
import { useTools } from '../../context/ToolsContext';
import { telegramApi, TelegramBotInfo } from '../../services/telegramApi';
import { soundFx } from '../../services/soundFx';

export const TelegramBotWidget: React.FC = () => {
  const { secrets, setIsPasswordModalOpen } = useDashboard();
  const { isVaultUnlocked } = useVault();
  const { addLog } = useTools();

  const botTokenSecret = secrets.find(s => s.name === 'TELEGRAM_BOT_TOKEN');
  const chatIdSecret = secrets.find(s => s.name === 'TELEGRAM_CHAT_ID');

  const tokenValue = botTokenSecret?.value || '';
  const chatIdValue = chatIdSecret?.value || '';

  const isConfigured = Boolean(tokenValue && tokenValue !== '••••••••••••••••' && !tokenValue.includes('sample_bot_token'));

  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [quickMsg, setQuickMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleTestBot = async () => {
    soundFx.playClick(900);
    setTestStatus('testing');
    setStatusMsg('Testing getMe...');

    const res = await telegramApi.testBot(tokenValue);
    if (res.ok && res.result) {
      soundFx.playDeploySuccess();
      setBotInfo(res.result);
      setTestStatus('ok');
      setStatusMsg(`@${res.result.username || res.result.first_name} (ID: ${res.result.id})`);
      addLog('TELEGRAM', `Bot verified: @${res.result.username || res.result.first_name}`, 'success');
    } else {
      soundFx.playAlarm();
      setTestStatus('error');
      setStatusMsg(res.description || 'Failed to verify token');
      addLog('TELEGRAM', `Bot verify error: ${res.description}`, 'alert');
    }
  };

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.trim()) return;

    soundFx.playClick(800);
    setIsSending(true);
    setStatusMsg('Dispatching message...');

    const res = await telegramApi.sendMessage(tokenValue, chatIdValue, `📡 *[000 Control]* ${quickMsg}`);
    setIsSending(false);

    if (res.ok) {
      soundFx.playDeploySuccess();
      setStatusMsg(`Sent OK! (msg_id: ${res.result?.message_id})`);
      addLog('TELEGRAM', `Message sent to ${chatIdValue}: "${quickMsg.slice(0, 30)}..."`, 'success');
      setQuickMsg('');
    } else {
      soundFx.playAlarm();
      setStatusMsg(`Send failed: ${res.description}`);
      addLog('TELEGRAM', `Send failed: ${res.description}`, 'critical');
    }
  };

  if (!isConfigured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ background: 'rgba(250, 204, 21, 0.08)', border: '1px solid var(--yellow)', padding: '6px', borderRadius: '3px' }}>
          <div style={{ color: 'var(--yellow)', fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
            ⚠️ TELEGRAM_BOT_TOKEN UNCONFIGURED
          </div>
          <div style={{ color: 'var(--fg-dim)', fontSize: '9.5px', lineHeight: '1.3' }}>
            To enable live Telegram dispatches, configure your Bot Token and Chat ID in the Vault (B1).
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {!isVaultUnlocked ? (
            <button className="btn-accent" onClick={() => setIsPasswordModalOpen(true)} style={{ flex: 1 }}>
              [🔑 Unlock Vault to Configure]
            </button>
          ) : (
            <div style={{ fontSize: '9px', color: 'var(--cyan)' }}>
              Edit `TELEGRAM_BOT_TOKEN` in Secrets Vault (B1)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`pill ${testStatus === 'ok' ? 'green' : testStatus === 'error' ? 'red' : 'cyan'}`}>
          {testStatus === 'ok' ? '● BOT ONLINE' : testStatus === 'error' ? '● ERROR' : '● CONFIGURED'}
        </span>
        <button onClick={handleTestBot} disabled={testStatus === 'testing'}>
          {testStatus === 'testing' ? 'Testing...' : '[Test getMe]'}
        </button>
      </div>

      <div style={{ fontSize: '9.5px', color: 'var(--fg-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {statusMsg || `Target: ${chatIdValue || 'No Chat ID'}`}
      </div>

      <form onSubmit={handleQuickSend} style={{ display: 'flex', gap: '3px' }}>
        <input
          type="text"
          value={quickMsg}
          onChange={e => setQuickMsg(e.target.value)}
          placeholder="Quick alert text..."
          style={{ flex: 1, fontSize: '9.5px' }}
        />
        <button type="submit" className="btn-accent" disabled={isSending || !quickMsg.trim()}>
          {isSending ? '...' : '[⚡ Send]'}
        </button>
      </form>
    </div>
  );
};

export const TelegramExpandedWorkbench: React.FC = () => {
  const { secrets, defcon } = useDashboard();
  const { addLog } = useTools();

  const botTokenSecret = secrets.find(s => s.name === 'TELEGRAM_BOT_TOKEN');
  const chatIdSecret = secrets.find(s => s.name === 'TELEGRAM_CHAT_ID');

  const [tokenInput, setTokenInput] = useState(botTokenSecret?.value || '');
  const [chatIdInput, setChatIdInput] = useState(chatIdSecret?.value || '');
  const [messageBody, setMessageBody] = useState('🚨 *[000 ALERT]* DEFCON Level Active.\nAll operational systems responding nominally.');
  const [parseMode, setParseMode] = useState<'Markdown' | 'HTML' | 'None'>('Markdown');

  const [apiResponse, setApiResponse] = useState<string>('{\n  "status": "idle",\n  "hint": "Click [Test getMe] or [Dispatch Broadcast] to inspect live API output"\n}');
  const [httpStatus, setHttpStatus] = useState<string>('READY');
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState<number>(0);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (botTokenSecret?.value && !tokenInput) {
      setTokenInput(botTokenSecret.value);
    }
    if (chatIdSecret?.value && !chatIdInput) {
      setChatIdInput(chatIdSecret.value);
    }
  }, [botTokenSecret, chatIdSecret]);

  const handleTestBot = async () => {
    soundFx.playClick(900);
    setIsBusy(true);
    const start = performance.now();

    const res = await telegramApi.testBot(tokenInput);
    const elapsed = Math.round(performance.now() - start);
    setLastLatency(elapsed);
    setIsBusy(false);

    setHttpStatus(res.ok ? '200 OK' : `${res.error_code || 400} ERROR`);
    setApiResponse(JSON.stringify(res, null, 2));

    if (res.ok) {
      soundFx.playDeploySuccess();
      addLog('TELEGRAM', `Tested bot @${res.result?.username} in ${elapsed}ms`, 'success');
    } else {
      soundFx.playAlarm();
      addLog('TELEGRAM', `Bot test failed: ${res.description}`, 'alert');
    }
  };

  const handleDispatch = async () => {
    if (!tokenInput.trim() || !chatIdInput.trim() || !messageBody.trim()) return;

    soundFx.playClick(800);
    setIsBusy(true);
    const start = performance.now();

    const res = await telegramApi.sendMessage(tokenInput, chatIdInput, messageBody, parseMode);
    const elapsed = Math.round(performance.now() - start);
    setLastLatency(elapsed);
    setIsBusy(false);

    setHttpStatus(res.ok ? '200 OK' : `${res.error_code || 400} FAILED`);
    setApiResponse(JSON.stringify(res, null, 2));

    if (res.ok) {
      soundFx.playDeploySuccess();
      setSentCount(c => c + 1);
      addLog('TELEGRAM', `Broadcast sent to ${chatIdInput} (msg_id: ${res.result?.message_id})`, 'success');
    } else {
      soundFx.playAlarm();
      addLog('TELEGRAM', `Broadcast failed: ${res.description}`, 'critical');
    }
  };

  const handleApplyTemplate = (tpl: string) => {
    soundFx.playClick(1000);
    if (tpl === 'defcon') {
      setMessageBody(`🚨 *[DEFCON ${defcon} EMERGENCY ALERT]*\n- *Host*: 000.localhost:3000\n- *Time*: ${new Date().toISOString()}\n- *Status*: Security perimeter locked down.`);
    } else if (tpl === 'deploy') {
      setMessageBody(`🚀 *[RELEASE DEPLOYMENT SUCCESS]*\n- *Version*: v2.6.4-prod\n- *Cluster*: Cloud Run Ingress\n- *Duration*: 3.1s\n- *SLA*: 99.98% nominal.`);
    } else if (tpl === 'sla') {
      setMessageBody(`⚠️ *[SRE INCIDENT NOTIFICATION]*\n- *Service*: Staging E-Commerce Hub\n- *Latency*: 168ms (>100ms SLA Threshold)\n- *Operator*: ROOT investigating.`);
    }
  };

  const curlSnippet = `curl -X POST "https://api.telegram.org/bot${tokenInput || '<BOT_TOKEN>'}/sendMessage" \\
  -H "Content-Type: application/json" \\
  -d '{"chat_id": "${chatIdInput || '<CHAT_ID>'}", "text": "${messageBody.replace(/\n/g, ' ')}", "parse_mode": "${parseMode}"}'`;

  return (
    <div className="workbench-split">
      {/* Left Column: Form and Config */}
      <div className="workbench-left" style={{ padding: '6px', gap: '6px' }}>
        <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
          TELEGRAM BOT DISPATCHER & CONFIG
        </div>

        <div>
          <label style={{ fontSize: '9px', color: 'var(--fg-muted)', display: 'block', marginBottom: '2px' }}>
            BOT TOKEN (FROM VAULT)
          </label>
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="123456789:ABCDefgh..."
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '9px', color: 'var(--fg-muted)', display: 'block', marginBottom: '2px' }}>
            TARGET CHAT ID / CHANNEL (@channel or -100...)
          </label>
          <input
            type="text"
            value={chatIdInput}
            onChange={e => setChatIdInput(e.target.value)}
            placeholder="-100123456789 or @sre_alerts"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', marginBottom: '2px' }}>
            PRE-BUILT INCIDENT TEMPLATES
          </div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            <button onClick={() => handleApplyTemplate('defcon')}>🚨 DEFCON Alert</button>
            <button onClick={() => handleApplyTemplate('deploy')}>🚀 Deploy Success</button>
            <button onClick={() => handleApplyTemplate('sla')}>⚠️ SLA Degradation</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--fg-muted)' }}>MESSAGE BODY</label>
            <div style={{ display: 'flex', gap: '2px' }}>
              {(['Markdown', 'HTML', 'None'] as const).map(pm => (
                <button
                  key={pm}
                  className={parseMode === pm ? 'btn-accent' : ''}
                  onClick={() => setParseMode(pm)}
                  style={{ fontSize: '8.5px', padding: '0 3px' }}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={messageBody}
            onChange={e => setMessageBody(e.target.value)}
            style={{ flex: 1, width: '100%', background: '#000', color: '#fff', border: '1px solid var(--border)', resize: 'none', padding: '4px', fontSize: '10px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleTestBot} disabled={isBusy} style={{ flex: 1 }}>
            {isBusy ? '...' : '[Test getMe]'}
          </button>
          <button className="btn-accent" onClick={handleDispatch} disabled={isBusy} style={{ flex: 1.5 }}>
            {isBusy ? 'Dispatching...' : '[⚡ Dispatch Broadcast]'}
          </button>
        </div>
      </div>

      {/* Right Column: Inspector & Live Response */}
      <div className="workbench-right" style={{ gap: '6px' }}>
        <div className="exp-metric-grid">
          <div className="exp-metric-box">
            <div className="exp-metric-label">HTTP STATUS</div>
            <div className="exp-metric-val" style={{ color: httpStatus.includes('200') ? 'var(--green)' : httpStatus.includes('ERROR') ? 'var(--red)' : 'var(--fg)' }}>
              {httpStatus}
            </div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">LAST RTT</div>
            <div className="exp-metric-val">{lastLatency !== null ? `${lastLatency}ms` : '—'}</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">DISPATCHED</div>
            <div className="exp-metric-val" style={{ color: 'var(--cyan)' }}>{sentCount}</div>
          </div>
          <div className="exp-metric-box">
            <div className="exp-metric-label">PARSE MODE</div>
            <div className="exp-metric-val">{parseMode}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '120px' }}>
          <div style={{ fontSize: '9px', color: 'var(--cyan)', fontWeight: 'bold', marginBottom: '2px' }}>
            TELEGRAM API JSON RESPONSE STREAM
          </div>
          <pre style={{ flex: 1, background: '#020305', border: '1px solid var(--border)', padding: '6px', overflow: 'auto', color: 'var(--fg)', fontSize: '10px', lineHeight: '1.3' }}>
            {apiResponse}
          </pre>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '9px', color: 'var(--fg-muted)', fontWeight: 'bold', marginBottom: '2px' }}>
            EQUIVALENT CURL RUNNER
          </div>
          <pre style={{ background: '#000', border: '1px solid var(--border)', padding: '4px', color: 'var(--green)', fontSize: '9px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {curlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
