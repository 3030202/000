export type Environment = 'production' | 'staging' | 'development' | 'infra' | 'internal';

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking' | 'unknown';

export interface ProjectLink {
  label: string;
  url: string;
  type: 'web' | 'repo' | 'api' | 'docs' | 'ci' | 'cloud' | 'analytics' | 'db' | 'terminal';
}

export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  category: 'Fullstack' | 'AI & LLM' | 'Backend API' | 'Mobile & Web' | 'Cloud Infra' | 'DevOps & CI/CD';
  env: Environment;
  status: ServiceStatus;
  latency?: number;
  healthUrl?: string;
  tags: string[];
  links: ProjectLink[];
  updatedAt: string;
  description: string;
  starred?: boolean;
}

export type SecretCategory = 'API Key' | 'OAuth / Token' | 'SSH / RSA Key' | 'Database Connection' | 'Webhook Secret' | 'Cloud Credentials';

export interface SecretItem {
  id: string;
  name: string;
  category: SecretCategory;
  value: string; // Plaintext when unlocked, or ciphertext representation
  maskedValue?: string;
  env: Environment;
  service: string;
  tags: string[];
  description: string;
  expiresAt?: string;
  isRevealed?: boolean;
  lastCopiedAt?: string;
}

export interface ArtifactItem {
  id: string;
  name: string;
  version: string;
  category: 'Docker Image' | 'Release Binary' | 'SSL / Cert' | 'Config Dump' | 'Database Backup' | 'AI Model Weights';
  size: string;
  sha256: string;
  downloadUrl: string;
  env: Environment;
  buildNumber: string;
  createdAt: string;
  status: 'verified' | 'signing' | 'archived';
  notes: string;
}

export interface HealthEndpoint {
  id: string;
  name: string;
  url: string;
  category: string;
  status: ServiceStatus;
  latencyMs: number;
  uptime24h: number;
  lastChecked: string;
  history: number[]; // Latency history for sparkline
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  category: 'Webhook' | 'Cache Flush' | 'Audit' | 'Deploy Trigger' | 'Diagnostics';
  type: 'http_post' | 'http_get' | 'curl' | 'diagnostic' | 'webhook';
  targetUrl?: string;
  payload?: Record<string, any>;
  headers?: Record<string, string>;
  commandSnippet?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'alert' | 'critical';
  action: string;
  details: string;
  operator: string;
}

export type DefconLevel = 5 | 4 | 3 | 2 | 1;

export type ActiveTab = 'overview' | 'projects' | 'vault' | 'artifacts' | 'monitoring' | 'ops' | 'topology';
