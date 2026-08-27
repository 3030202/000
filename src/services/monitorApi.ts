// =============================================================================
// 000-MISSION-CONTROL: TYPED CLIENT FOR THE REAL-DATA MONITORING API
// All requests go through /api/monitor/* which nginx proxies to 000_api:4000
// In Electron mode the API is at its exposed port (configurable).
// =============================================================================

// ── Base URL resolution ───────────────────────────────────────────────────────
// In production (Docker): nginx proxies /api/monitor/* → api:4000/monitor/*
// In Electron desktop:    webSecurity:false + direct port access
// In Vite dev server:     uses the built-in CORS proxy if needed
function getBaseUrl(): string {
  // Electron desktop: connect directly to api on localhost:4001
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    return 'http://localhost:4001';
  }
  // Web (production + dev): relative path, proxied by nginx or vite
  return '';
}

const API_BASE = () => `${getBaseUrl()}/api`;

// ── Timeout wrapper ───────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getJSON<T>(path: string, timeoutMs = 8000): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE()}${path}`, {}, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown, timeoutMs = 10000): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface ApiHealthResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  uptime: number;
  ts: string;
}

export interface CpuInfo {
  usage: number;    // %
  cores: number;
  model: string;
}

export interface MemoryInfo {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  buffersMb: number;
  cachedMb: number;
  pct: number;
  swap: { totalMb: number; usedMb: number; pct: number };
}

export interface DiskEntry {
  fs: string;
  fstype: string;
  sizeMb: number;
  usedMb: number;
  availMb: number;
  pct: number;
  mount: string;
}

export interface NetworkInfo {
  txBytesPerSec: number;
  rxBytesPerSec: number;
}

export interface ProcessEntry {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  state: string;
  command: string;
}

export interface SystemResponse {
  hostname: string;
  platform: string;
  arch: string;
  uptime: number;
  uptimeHuman: string;
  loadAvg: [number, number, number];
  cpu: CpuInfo;
  memory: MemoryInfo;
  disk: DiskEntry[];
  network: NetworkInfo;
  processes: ProcessEntry[];
  ts: string;
}

export interface DockerContainerStats {
  name: string;
  cpu: string;
  memUsage: string;
  memPct: string;
  netIO: string;
  blockIO: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
  stats: DockerContainerStats | null;
}

export interface DockerResponse {
  available: boolean;
  containers: DockerContainer[];
  ts: string;
}

export interface PingResult {
  id: string;
  name: string;
  url: string;
  status: 'operational' | 'degraded' | 'down' | 'timeout' | 'error';
  httpCode: number;
  latencyMs: number;
  uptime24h: number;
  checkedAt: string;
  error?: string;
}

export interface PingResponse {
  endpoints: PingResult[];
  ts: string;
}

// ── API availability cache ────────────────────────────────────────────────────
let _apiAvailable: boolean | null = null;
let _lastCheck = 0;
const AVAILABILITY_TTL = 30_000; // 30s

export async function checkApiAvailability(): Promise<boolean> {
  const now = Date.now();
  if (_apiAvailable !== null && now - _lastCheck < AVAILABILITY_TTL) {
    return _apiAvailable;
  }
  try {
    await fetchWithTimeout(`${API_BASE()}/health`, {}, 3000);
    _apiAvailable = true;
  } catch {
    _apiAvailable = false;
  }
  _lastCheck = now;
  return _apiAvailable;
}

export function invalidateApiCache() {
  _apiAvailable = null;
}

// ── Public API methods ────────────────────────────────────────────────────────

/** Check if the monitoring API itself is alive */
export async function getApiHealth(): Promise<ApiHealthResponse> {
  return getJSON<ApiHealthResponse>('/health', 3000);
}

/** Full system metrics: CPU, RAM, Disk, Network, Processes */
export async function getSystemMetrics(): Promise<SystemResponse> {
  return getJSON<SystemResponse>('/monitor/system');
}

/** Process list only (faster than full system) */
export async function getProcesses(): Promise<{ processes: ProcessEntry[]; ts: string }> {
  return getJSON('/monitor/processes');
}

/** Docker containers with live stats */
export async function getDockerStatus(): Promise<DockerResponse> {
  return getJSON<DockerResponse>('/monitor/docker');
}

/** Ping preconfigured health endpoints */
export async function pingHealthEndpoints(): Promise<PingResponse> {
  return getJSON<PingResponse>('/monitor/ping', 12000);
}

/** Ping custom URL list (max 20) */
export async function pingCustomUrls(urls: string[]): Promise<PingResponse> {
  return postJSON<PingResponse>('/monitor/ping', { urls }, 15000);
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatBps(bps: number): string {
  if (bps < 1024) return `${bps} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
  return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
}

export function statusColor(status: string): string {
  switch (status) {
    case 'operational': return 'var(--green)';
    case 'degraded':    return 'var(--yellow)';
    case 'timeout':     return 'var(--yellow)';
    case 'down':        return 'var(--red)';
    default:            return 'var(--fg-dim)';
  }
}

export function containerStateClass(state: string): string {
  switch (state?.toLowerCase()) {
    case 'running': return 'green';
    case 'exited':  return 'red';
    case 'paused':  return 'yellow';
    default:        return '';
  }
}
