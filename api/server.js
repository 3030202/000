#!/usr/bin/env node
// =============================================================================
// 000-MISSION-CONTROL: REAL-DATA MONITORING API SERVER
// Zero external dependencies — pure Node.js built-ins only.
// Endpoints:
//   GET  /health                      — API liveness probe
//   GET  /monitor/system              — CPU, RAM, Disk, Network, Uptime
//   GET  /monitor/processes           — Top processes by CPU
//   GET  /monitor/docker              — Docker containers list & stats
//   POST /monitor/docker/action       — Safe Docker action (start/stop/restart)
//   GET  /monitor/sse/metrics         — Server-Sent Events live metrics stream
//   GET  /monitor/sse/logs            — Server-Sent Events container logs stream
//   GET  /monitor/ssl                 — SSL/TLS Certificate inspector
//   GET  /monitor/ping                — Ping configured health endpoints
//   POST /monitor/ping                — Custom ping { urls: string[] }
//   POST /monitor/webhook/dispatch    — Outgoing webhook relay
// =============================================================================

'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const dns = require('dns').promises;

const PORT = process.env.API_PORT || 4000;
const HOST = process.env.API_HOST || '0.0.0.0';
const MISSION_SECRET = process.env.MISSION_SECRET || '';

// ─── Health endpoints to monitor (can be overridden via ENV) ─────────────────
const DEFAULT_HEALTH_ENDPOINTS = process.env.HEALTH_ENDPOINTS
  ? JSON.parse(process.env.HEALTH_ENDPOINTS)
  : [
      { id: 'dashboard',  name: '000 Dashboard',         url: 'http://app:80/' },
      { id: 'ollama',     name: 'Ollama LLM Engine',     url: 'http://172.21.0.1:11434/api/version' },
      { id: 'google',     name: 'Google Connectivity',   url: 'https://www.google.com' },
      { id: 'cloudflare', name: 'Cloudflare CDN',        url: 'https://1.1.1.1' },
      { id: 'github',     name: 'GitHub',                url: 'https://github.com' },
    ];

// ─── CORS helper ─────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mission-Secret');
}

function sendJSON(res, statusCode, data) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

// ─── Auth Verification ───────────────────────────────────────────────────────
function verifyAuth(req) {
  if (!MISSION_SECRET) return true; // Open if secret not configured
  const token = req.headers['x-mission-secret'] ||
    (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : '');
  return token === MISSION_SECRET;
}

// ─── /proc/stat CPU reader ────────────────────────────────────────────────────
let _lastCpuTimes = null;

function readCpuStat() {
  try {
    const data = fs.readFileSync('/proc/stat', 'utf8');
    const lines = data.split('\n');
    const cpuLine = lines[0]; // 'cpu  ...'
    const parts = cpuLine.trim().split(/\s+/).slice(1).map(Number);
    const [user, nice, system, idle, iowait = 0, irq = 0, softirq = 0, steal = 0] = parts;
    const idleTotal = idle + iowait;
    const nonIdle = user + nice + system + irq + softirq + steal;
    const total = idleTotal + nonIdle;
    return { total, idle: idleTotal };
  } catch {
    return null;
  }
}

async function getCpuUsage() {
  const t1 = readCpuStat();
  if (!t1) {
    const [load1] = os.loadavg();
    const cores = os.cpus().length;
    return Math.min(100, Math.round((load1 / cores) * 100 * 10) / 10);
  }

  if (_lastCpuTimes) {
    const prevTotal = _lastCpuTimes.total;
    const prevIdle = _lastCpuTimes.idle;
    const deltaTotal = t1.total - prevTotal;
    const deltaIdle = t1.idle - prevIdle;
    _lastCpuTimes = t1;
    if (deltaTotal === 0) return 0;
    return Math.round(((deltaTotal - deltaIdle) / deltaTotal) * 1000) / 10;
  }

  _lastCpuTimes = t1;
  await new Promise(r => setTimeout(r, 200));
  const t2 = readCpuStat();
  if (!t2) return 0;
  _lastCpuTimes = t2;
  const deltaTotal = t2.total - t1.total;
  const deltaIdle = t2.idle - t1.idle;
  if (deltaTotal === 0) return 0;
  return Math.round(((deltaTotal - deltaIdle) / deltaTotal) * 1000) / 10;
}

// ─── /proc/meminfo parser ─────────────────────────────────────────────────────
function getMemoryInfo() {
  try {
    const data = fs.readFileSync('/proc/meminfo', 'utf8');
    const get = (key) => {
      const m = data.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
      return m ? parseInt(m[1], 10) : 0;
    };
    const totalKb = get('MemTotal');
    const freeKb = get('MemFree');
    const availableKb = get('MemAvailable');
    const buffersKb = get('Buffers');
    const cachedKb = get('Cached');
    const swapTotalKb = get('SwapTotal');
    const swapFreeKb = get('SwapFree');

    const usedKb = totalKb - availableKb;
    return {
      totalMb: Math.round(totalKb / 1024),
      usedMb: Math.round(usedKb / 1024),
      freeMb: Math.round(availableKb / 1024),
      buffersMb: Math.round(buffersKb / 1024),
      cachedMb: Math.round(cachedKb / 1024),
      pct: totalKb > 0 ? Math.round((usedKb / totalKb) * 1000) / 10 : 0,
      swap: {
        totalMb: Math.round(swapTotalKb / 1024),
        usedMb: Math.round((swapTotalKb - swapFreeKb) / 1024),
        pct: swapTotalKb > 0
          ? Math.round(((swapTotalKb - swapFreeKb) / swapTotalKb) * 1000) / 10
          : 0,
      },
    };
  } catch {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      totalMb: Math.round(total / 1024 / 1024),
      usedMb: Math.round(used / 1024 / 1024),
      freeMb: Math.round(free / 1024 / 1024),
      buffersMb: 0,
      cachedMb: 0,
      pct: Math.round((used / total) * 1000) / 10,
      swap: { totalMb: 0, usedMb: 0, pct: 0 },
    };
  }
}

// ─── df disk usage ────────────────────────────────────────────────────────────
function getDiskInfo() {
  return new Promise((resolve) => {
    exec("df -BM --output=source,fstype,size,used,avail,pcent,target 2>/dev/null | tail -n +2", (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve([{ fs: '/', sizeMb: 0, usedMb: 0, availMb: 0, pct: 0, mount: '/' }]);
        return;
      }
      const rows = stdout.trim().split('\n')
        .map(line => {
          const p = line.trim().split(/\s+/);
          if (p.length < 7) return null;
          const fstype = p[1];
          if (['tmpfs','devtmpfs','overlay','proc','sysfs','udev','devpts','cgroup','cgroup2','hugetlbfs','mqueue','pstore','debugfs'].includes(fstype)) return null;
          return {
            fs: p[0],
            fstype,
            sizeMb: parseInt(p[2], 10),
            usedMb: parseInt(p[3], 10),
            availMb: parseInt(p[4], 10),
            pct: parseInt(p[5], 10),
            mount: p[6],
          };
        })
        .filter(Boolean);
      resolve(rows.length > 0 ? rows : [{ fs: '/', sizeMb: 0, usedMb: 0, availMb: 0, pct: 0, mount: '/' }]);
    });
  });
}

// ─── /proc/net/dev network I/O ────────────────────────────────────────────────
let _lastNetSample = null;

function readNetStat() {
  try {
    const data = fs.readFileSync('/proc/net/dev', 'utf8');
    const lines = data.split('\n').slice(2);
    let rxBytes = 0, txBytes = 0;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const iface = parts[0].replace(':', '');
      if (iface === 'lo') continue;
      rxBytes += parseInt(parts[1], 10) || 0;
      txBytes += parseInt(parts[9], 10) || 0;
    }
    return { rxBytes, txBytes, ts: Date.now() };
  } catch {
    return null;
  }
}

function getNetworkStats() {
  const current = readNetStat();
  if (!current || !_lastNetSample) {
    _lastNetSample = current;
    return { txBytesPerSec: 0, rxBytesPerSec: 0 };
  }
  const elapsed = (current.ts - _lastNetSample.ts) / 1000;
  const txBps = elapsed > 0 ? Math.round((current.txBytes - _lastNetSample.txBytes) / elapsed) : 0;
  const rxBps = elapsed > 0 ? Math.round((current.rxBytes - _lastNetSample.rxBytes) / elapsed) : 0;
  _lastNetSample = current;
  return { txBytesPerSec: Math.max(0, txBps), rxBytesPerSec: Math.max(0, rxBps) };
}

// ─── CPU core info ────────────────────────────────────────────────────────────
function getCpuModel() {
  try {
    const cpus = os.cpus();
    return { model: cpus[0]?.model || 'Unknown', cores: cpus.length };
  } catch {
    return { model: 'Unknown', cores: 1 };
  }
}

// ─── Top processes from /proc ─────────────────────────────────────────────────
function getProcesses() {
  return new Promise((resolve) => {
    exec("ps aux --sort=-%cpu 2>/dev/null | head -16", (err, stdout) => {
      if (err || !stdout) { resolve([]); return; }
      const lines = stdout.trim().split('\n').slice(1);
      const procs = lines.slice(0, 12).map(line => {
        const parts = line.trim().split(/\s+/);
        const [user, pid, cpu, mem, , , , state] = parts;
        const command = parts.slice(10).join(' ').substring(0, 60);
        return {
          pid: parseInt(pid, 10),
          user: user || '?',
          cpu: parseFloat(cpu) || 0,
          mem: parseFloat(mem) || 0,
          state: (state || 'S')[0],
          command,
        };
      }).filter(p => !isNaN(p.pid));
      resolve(procs);
    });
  });
}

// ─── Docker containers ────────────────────────────────────────────────────────
function getDockerContainers() {
  return new Promise((resolve) => {
    const fmt = '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}","created":"{{.RunningFor}}"}';
    exec(`docker ps -a --format '${fmt}' 2>/dev/null`, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ available: false, containers: [] });
        return;
      }
      const containers = stdout.trim().split('\n').map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
      resolve({ available: true, containers });
    });
  });
}

function getDockerStats() {
  return new Promise((resolve) => {
    exec('docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}" 2>/dev/null', (err, stdout) => {
      if (err || !stdout.trim()) { resolve([]); return; }
      const stats = stdout.trim().split('\n').map(line => {
        const [name, cpu, memUsage, memPct, netIO, blockIO] = line.split('|');
        return { name, cpu: cpu?.replace('%',''), memUsage, memPct: memPct?.replace('%',''), netIO, blockIO };
      });
      resolve(stats);
    });
  });
}

// ─── Parallel HTTP ping ───────────────────────────────────────────────────────
async function pingEndpoints(endpoints) {
  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(ep.url, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
        }).finally(() => clearTimeout(timer));
        const latency = Date.now() - start;
        return {
          id: ep.id,
          name: ep.name,
          url: ep.url,
          status: resp.ok || resp.status < 500 ? 'operational' : 'degraded',
          httpCode: resp.status,
          latencyMs: latency,
          uptime24h: 99.9,
          checkedAt: new Date().toISOString(),
        };
      } catch (e) {
        return {
          id: ep.id,
          name: ep.name,
          url: ep.url,
          status: e.name === 'AbortError' ? 'timeout' : 'down',
          httpCode: 0,
          latencyMs: Date.now() - start,
          uptime24h: 0,
          checkedAt: new Date().toISOString(),
          error: e.message,
        };
      }
    })
  );

  return results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason?.message });
}

// ─── SSL/TLS Certificate Inspect ──────────────────────────────────────────────
function inspectTlsCertificate(domain) {
  return new Promise((resolve) => {
    const host = domain.trim();
    const socket = tls.connect(443, host, { servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(true);
      socket.destroy();
      if (!cert || !cert.valid_to) {
        resolve({
          domain: host,
          issuer: 'Unknown',
          validFrom: '',
          validTo: '',
          daysRemaining: 0,
          status: 'error',
          error: 'No peer certificate found',
        });
        return;
      }
      const validToDate = new Date(cert.valid_to);
      const validFromDate = new Date(cert.valid_from);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.floor((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const status = daysRemaining === 0 ? 'expired' : daysRemaining < 15 ? 'expiring' : 'valid';

      resolve({
        domain: host,
        issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown CA',
        validFrom: validFromDate.toISOString().split('T')[0],
        validTo: validToDate.toISOString().split('T')[0],
        daysRemaining,
        status,
        subjectAltNames: cert.subjectaltname ? cert.subjectaltname.split(', ') : [host],
        protocol: socket.getProtocol ? socket.getProtocol() : 'TLS 1.3',
      });
    });

    socket.setTimeout(4000, () => {
      socket.destroy();
      resolve({
        domain: host,
        issuer: 'Timeout',
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        status: 'error',
        error: 'Connection timed out',
      });
    });

    socket.on('error', (err) => {
      resolve({
        domain: host,
        issuer: 'Connection error',
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        status: 'error',
        error: err.message,
      });
    });
  });
}

// ─── Body reader ─────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Verify auth for all /monitor/ endpoints (except /health)
  if (path.startsWith('/monitor') && !verifyAuth(req)) {
    sendJSON(res, 401, { error: 'Unauthorized: Master Secret required' });
    return;
  }

  try {
    // ── GET /health ──────────────────────────────────────────────────────────
    if (req.method === 'GET' && path === '/health') {
      sendJSON(res, 200, {
        status: 'ok',
        service: '000-api',
        version: '1.2.0',
        uptime: process.uptime(),
        ts: new Date().toISOString(),
      });
      return;
    }

    // ── GET /monitor/system ──────────────────────────────────────────────────
    if (req.method === 'GET' && path === '/monitor/system') {
      const [cpuUsage, memory, disk, network, processes] = await Promise.all([
        getCpuUsage(),
        Promise.resolve(getMemoryInfo()),
        getDiskInfo(),
        Promise.resolve(getNetworkStats()),
        getProcesses(),
      ]);
      const { model, cores } = getCpuModel();

      sendJSON(res, 200, {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        uptimeHuman: formatUptime(os.uptime()),
        loadAvg: os.loadavg().map(v => Math.round(v * 100) / 100),
        cpu: { usage: cpuUsage, cores, model },
        memory,
        disk,
        network,
        processes,
        ts: new Date().toISOString(),
      });
      return;
    }

    // ── GET /monitor/sse/metrics (Server-Sent Events) ─────────────────────────
    if (req.method === 'GET' && path === '/monitor/sse/metrics') {
      setCors(res);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(': keepalive\n\n');

      const interval = setInterval(async () => {
        try {
          const [cpuUsage, memory, network] = await Promise.all([
            getCpuUsage(),
            Promise.resolve(getMemoryInfo()),
            Promise.resolve(getNetworkStats()),
          ]);
          const payload = JSON.stringify({
            cpu: cpuUsage,
            ram: memory.pct,
            usedMb: memory.usedMb,
            totalMb: memory.totalMb,
            tx: network.txBytesPerSec,
            rx: network.rxBytesPerSec,
            ts: Date.now(),
          });
          res.write(`data: ${payload}\n\n`);
        } catch {
          // ignore stream write error
        }
      }, 1500);

      req.on('close', () => clearInterval(interval));
      return;
    }

    // ── GET /monitor/sse/logs (Server-Sent Events for Docker container) ───────
    if (req.method === 'GET' && path === '/monitor/sse/logs') {
      const container = url.searchParams.get('container') || '000_app';
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(container)) {
        sendJSON(res, 400, { error: 'Invalid container name' });
        return;
      }

      setCors(res);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(`: log stream started for ${container}\n\n`);

      const logProc = spawn('docker', ['logs', '-f', '--tail', '50', container]);
      logProc.stdout.on('data', chunk => {
        res.write(`data: ${JSON.stringify({ line: chunk.toString().trim() })}\n\n`);
      });
      logProc.stderr.on('data', chunk => {
        res.write(`data: ${JSON.stringify({ line: chunk.toString().trim(), err: true })}\n\n`);
      });

      req.on('close', () => {
        logProc.kill('SIGTERM');
      });
      return;
    }

    // ── GET /monitor/processes ───────────────────────────────────────────────
    if (req.method === 'GET' && path === '/monitor/processes') {
      const processes = await getProcesses();
      sendJSON(res, 200, { processes, ts: new Date().toISOString() });
      return;
    }

    // ── GET /monitor/docker ──────────────────────────────────────────────────
    if (req.method === 'GET' && path === '/monitor/docker') {
      const [containersResult, stats] = await Promise.all([
        getDockerContainers(),
        getDockerStats(),
      ]);

      const statsMap = Object.fromEntries(stats.map(s => [s.name, s]));
      const containers = containersResult.containers.map(c => ({
        ...c,
        stats: statsMap[c.name] || null,
      }));

      sendJSON(res, 200, {
        available: containersResult.available,
        containers,
        ts: new Date().toISOString(),
      });
      return;
    }

    // ── POST /monitor/docker/action (Safe container ops) ──────────────────────
    if (req.method === 'POST' && path === '/monitor/docker/action') {
      const body = await readBody(req);
      const { containerId, action } = body;
      const allowedActions = ['start', 'stop', 'restart'];

      if (!allowedActions.includes(action) || !containerId || !/^[a-zA-Z0-9_\-\.]+$/.test(containerId)) {
        sendJSON(res, 400, { error: 'Invalid container or action. Allowed: start, stop, restart.' });
        return;
      }

      exec(`docker ${action} ${containerId}`, (err, stdout, stderr) => {
        if (err) {
          sendJSON(res, 500, { success: false, error: stderr.trim() || err.message });
          return;
        }
        sendJSON(res, 200, {
          success: true,
          action,
          container: containerId,
          output: stdout.trim(),
          ts: new Date().toISOString(),
        });
      });
      return;
    }

    // ── GET /monitor/ssl ─────────────────────────────────────────────────────
    if (req.method === 'GET' && path === '/monitor/ssl') {
      const rawDomains = url.searchParams.get('domains') || '03.0x101.lol,cloudflare.com,github.com';
      const domains = rawDomains.split(',').map(d => d.trim()).filter(Boolean).slice(0, 10);
      const certs = await Promise.all(domains.map(inspectTlsCertificate));
      sendJSON(res, 200, { certs, ts: new Date().toISOString() });
      return;
    }

    // ── GET /monitor/ping ────────────────────────────────────────────────────
    if (req.method === 'GET' && path === '/monitor/ping') {
      const results = await pingEndpoints(DEFAULT_HEALTH_ENDPOINTS);
      sendJSON(res, 200, { endpoints: results, ts: new Date().toISOString() });
      return;
    }

    // ── POST /monitor/ping ───────────────────────────────────────────────────
    if (req.method === 'POST' && path === '/monitor/ping') {
      const body = await readBody(req);
      const urls = (body.urls || []).slice(0, 20);
      const endpoints = urls.map((u, i) => ({ id: `custom-${i}`, name: u, url: u }));
      const results = await pingEndpoints(endpoints);
      sendJSON(res, 200, { endpoints: results, ts: new Date().toISOString() });
      return;
    }

    // ── POST /monitor/webhook/dispatch (Outgoing Webhook Relay) ───────────────
    if (req.method === 'POST' && path === '/monitor/webhook/dispatch') {
      const body = await readBody(req);
      const { url: targetUrl, method = 'POST', headers = {}, payload } = body;
      if (!targetUrl) {
        sendJSON(res, 400, { error: 'Target URL is required' });
        return;
      }
      const start = Date.now();
      try {
        const response = await fetch(targetUrl, {
          method,
          headers,
          body: method !== 'GET' && payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : undefined,
          signal: AbortSignal.timeout(10000),
        });
        const timeMs = Date.now() - start;
        const text = await response.text();
        sendJSON(res, 200, {
          status: response.status,
          statusText: response.statusText,
          timeMs,
          headers: Object.fromEntries(response.headers.entries()),
          bodyPreview: text.slice(0, 1000),
        });
      } catch (err) {
        sendJSON(res, 502, {
          error: err.message,
          timeMs: Date.now() - start,
        });
      }
      return;
    }

    // ── 404 ─────────────────────────────────────────────────────────────────
    sendJSON(res, 404, { error: 'Not Found', path });

  } catch (err) {
    console.error('[000-api] Error:', err);
    sendJSON(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

// ─── Warm-up network stats ───────────────────────────────────────────────────
_lastNetSample = readNetStat();

// ─── Start ───────────────────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
  console.log(`[000-api] Monitoring API running on http://${HOST}:${PORT}`);
  console.log(`[000-api] Endpoints: /health, /monitor/system, /monitor/sse/metrics, /monitor/docker, /monitor/ssl, /monitor/ping`);
  if (MISSION_SECRET) {
    console.log(`[000-api] Security: Master Secret auth enabled.`);
  }
});

server.on('error', (err) => {
  console.error('[000-api] Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });
