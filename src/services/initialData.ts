import { ProjectItem, SecretItem, ArtifactItem, HealthEndpoint, QuickAction, AuditLog } from '../types';

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-01',
    name: '000 Control Gateway',
    tagline: 'Centralized Micro-Proxy, Host Routing & Local Subdomain Gateway',
    category: 'Cloud Infra',
    env: 'production',
    status: 'operational',
    latency: 12,
    healthUrl: 'http://000.localhost:3000',
    tags: ['Core', 'Subdomain', 'Gateway', 'Vite', 'TypeScript'],
    links: [
      { label: 'Live Subdomain', url: 'http://000.localhost:3000', type: 'web' },
      { label: 'Local Dev', url: 'http://localhost:3000', type: 'web' },
      { label: 'Repository', url: 'https://github.com', type: 'repo' },
      { label: 'Cloud Run', url: 'https://console.cloud.google.com/run', type: 'cloud' }
    ],
    updatedAt: '2026-08-16 10:20',
    description: 'Master operational dashboard, secret vault and single-pane-of-glass infrastructure control deck.',
    starred: true
  },
  {
    id: 'proj-02',
    name: 'Gemini AI Pipeline & Agents',
    tagline: 'Multi-Agent Interactions API, Structured Output & Vector RAG',
    category: 'AI & LLM',
    env: 'production',
    status: 'operational',
    latency: 45,
    healthUrl: 'https://generativelanguage.googleapis.com',
    tags: ['Gemini 2.5', 'Python', 'BigQuery', 'Vector Search'],
    links: [
      { label: 'API Endpoint', url: 'https://ai.google.dev', type: 'api' },
      { label: 'Agent Specs', url: 'https://github.com', type: 'docs' },
      { label: 'GCP Metrics', url: 'https://console.cloud.google.com/monitoring', type: 'cloud' }
    ],
    updatedAt: '2026-08-16 09:40',
    description: 'Autonomous reasoning, code generation, and BigQuery data pipeline orchestration.',
    starred: true
  },
  {
    id: 'proj-03',
    name: 'Cloud Run Core Microservices',
    tagline: 'High-Throughput Containerized REST & gRPC Services',
    category: 'Backend API',
    env: 'production',
    status: 'operational',
    latency: 28,
    healthUrl: 'https://run.app',
    tags: ['Go', 'Docker', 'gRPC', 'PostgreSQL', 'Cloud Run'],
    links: [
      { label: 'GCP Service', url: 'https://console.cloud.google.com/run', type: 'cloud' },
      { label: 'Swagger API', url: 'https://swagger.io', type: 'api' },
      { label: 'CI/CD Pipelines', url: 'https://github.com/actions', type: 'ci' }
    ],
    updatedAt: '2026-08-15 18:12',
    description: 'Distributed microservice cluster managing authentication, payment webhooks, and real-time state.',
    starred: true
  },
  {
    id: 'proj-04',
    name: 'Firebase & Firestore Cluster',
    tagline: 'Real-time Datastore, Security Rules & Client Subscriptions',
    category: 'Cloud Infra',
    env: 'production',
    status: 'operational',
    latency: 18,
    tags: ['Firestore', 'NoSQL', 'Auth', 'Hosting'],
    links: [
      { label: 'Firebase Console', url: 'https://console.firebase.google.com', type: 'cloud' },
      { label: 'Firestore Rules', url: 'https://console.firebase.google.com/project/_/firestore/rules', type: 'docs' }
    ],
    updatedAt: '2026-08-14 12:00',
    description: 'Managed client state synchronization, serverless auth verification, and real-time push events.',
    starred: false
  },
  {
    id: 'proj-05',
    name: 'BigQuery Data Analytics Warehouse',
    tagline: 'Lakehouse Catalogs, Dataform ELT & ML Forecasting',
    category: 'DevOps & CI/CD',
    env: 'production',
    status: 'operational',
    latency: 64,
    tags: ['BigQuery', 'SQLX', 'Dataform', 'Parquet'],
    links: [
      { label: 'BigQuery Studio', url: 'https://console.cloud.google.com/bigquery', type: 'cloud' },
      { label: 'Data Pipelines', url: 'https://console.cloud.google.com/datapipelines', type: 'ci' }
    ],
    updatedAt: '2026-08-16 08:30',
    description: 'Automated ELT pipelines processing operational logs, telemetry, and analytics metrics.',
    starred: false
  },
  {
    id: 'proj-06',
    name: 'Knife & Tactical Commerce Hub',
    tagline: 'Modern High-Speed Storefront & Catalog Management',
    category: 'Fullstack',
    env: 'staging',
    status: 'degraded',
    latency: 140,
    tags: ['Next.js', 'Stripe', 'Tailwind', 'Edge'],
    links: [
      { label: 'Staging Preview', url: 'http://staging.000.localhost:3000', type: 'web' },
      { label: 'Stripe Dashboard', url: 'https://dashboard.stripe.com', type: 'cloud' }
    ],
    updatedAt: '2026-08-16 07:15',
    description: 'Ultra-fast tactical merchandise e-commerce platform with encrypted checkout and 3D previewer.',
    starred: false
  }
];

export const INITIAL_SECRETS: SecretItem[] = [
  {
    id: 'sec-01',
    name: 'GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY',
    category: 'Cloud Credentials',
    value: 'eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsICJwcm9qZWN0X2lkIjogImFneS1wcm9kLTIwMjYiLCAicHJpdmF0ZV9rZXlfaWQiOiAiODk3YmZhYzlkZWYzNDJjMCJ9',
    env: 'production',
    service: 'GCP Core IAM',
    tags: ['Production', 'KMS', 'ServiceAccount'],
    description: 'Primary Google Cloud service account JSON key for automated Terraform and Cloud Run deployments.',
    expiresAt: '2027-01-01'
  },
  {
    id: 'sec-02',
    name: 'GEMINI_INTERACTIONS_API_KEY',
    category: 'API Key',
    value: 'AIzaSyD9xK89F2M_Lq0pZ1vN7uB3c4e5g6h7i8j',
    env: 'production',
    service: 'Gemini AI API',
    tags: ['Gemini', 'GenerativeAI', 'HighQuota'],
    description: 'Tier-1 API key with multi-modal live stream and agent reasoning permissions.',
    expiresAt: '2026-12-31'
  },
  {
    id: 'sec-03',
    name: 'POSTGRES_MASTER_DATABASE_URL',
    category: 'Database Connection',
    value: 'postgresql://ops_admin:S3cur3P@ssw0rd!2026@db-master.cloud.google.internal:5432/mission_control?sslmode=verify-full',
    env: 'production',
    service: 'Cloud SQL Master',
    tags: ['PostgreSQL', 'SSL', 'MasterDB'],
    description: 'Encrypted connection string to production PostgreSQL replica with SSL validation.',
    expiresAt: '2028-06-15'
  },
  {
    id: 'sec-04',
    name: 'GITHUB_DEPLOYMENT_SSH_PRIVATE_KEY',
    category: 'SSH / RSA Key',
    value: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn\nNhAAAAAwEAAQAAAYEAv7842kf82...[ENCRYPTED_DEPLOY_KEY_2048]...==\n-----END OPENSSH PRIVATE KEY-----',
    env: 'production',
    service: 'GitHub CI/CD Runner',
    tags: ['SSH', 'Git', 'DeployKey'],
    description: 'RSA 4096-bit private key for automated repo syncing and continuous integration triggers.'
  },
  {
    id: 'sec-05',
    name: 'STRIPE_LIVE_WEBHOOK_SECRET_KEY',
    category: 'Webhook Secret',
    value: 'whsec_9b4f7e2a1c0d583e7489a2bcdef3401827495018274950a2b1c4',
    env: 'production',
    service: 'Stripe Payments',
    tags: ['Stripe', 'Webhooks', 'Finance'],
    description: 'Cryptographic signature verification secret for incoming charge and checkout events.',
    expiresAt: '2027-04-01'
  },
  {
    id: 'sec-06',
    name: 'JWT_ACCESS_TOKEN_SIGNING_SALT',
    category: 'OAuth / Token',
    value: '9f82c40a7b1e3d6f5a0c9b8d7e6f5a4b3c2d1e0f8a9b7c6d5e4f3a2b1c0d9e8f',
    env: 'production',
    service: 'Auth Microservice',
    tags: ['JWT', 'HS512', 'Auth'],
    description: 'HMAC-SHA512 private salt used for signing user session tokens and refresh cookies.'
  }
];

export const INITIAL_ARTIFACTS: ArtifactItem[] = [
  {
    id: 'art-01',
    name: 'gateway-core-v2.6.4-prod.tar.gz',
    version: 'v2.6.4',
    category: 'Release Binary',
    size: '42.8 MB',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    downloadUrl: '#download-gateway-v2.6.4',
    env: 'production',
    buildNumber: 'BUILD-9024',
    createdAt: '2026-08-16 04:15',
    status: 'verified',
    notes: 'Optimized Go binary with embedded WebCrypto and dynamic reverse proxy routing.'
  },
  {
    id: 'art-02',
    name: 'docker-image-000-deck-latest.tar',
    version: 'sha-89f2ab4',
    category: 'Docker Image',
    size: '118.2 MB',
    sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    downloadUrl: '#download-docker-000',
    env: 'production',
    buildNumber: 'BUILD-9021',
    createdAt: '2026-08-15 22:30',
    status: 'verified',
    notes: 'Alpine Linux container with Nginx & HTTP/3 Brotli compression.'
  },
  {
    id: 'art-03',
    name: 'wildcard.000.localhost.fullchain.pem',
    version: '2026.1',
    category: 'SSL / Cert',
    size: '3.4 KB',
    sha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    downloadUrl: '#download-ssl-cert',
    env: 'production',
    buildNumber: 'CERT-001',
    createdAt: '2026-08-10 14:00',
    status: 'verified',
    notes: 'Local CA self-signed wildcard root certificate for *.000.localhost and *.000.local.'
  },
  {
    id: 'art-04',
    name: 'database-pg-dump-snapshot-daily.sql.gz',
    version: 'snap-20260816',
    category: 'Database Backup',
    size: '254.1 MB',
    sha256: '7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
    downloadUrl: '#download-db-dump',
    env: 'production',
    buildNumber: 'BACKUP-884',
    createdAt: '2026-08-16 03:00',
    status: 'verified',
    notes: 'Full schema & tables snapshot with WAL replication checkpoint.'
  }
];

export const INITIAL_HEALTH_ENDPOINTS: HealthEndpoint[] = [
  {
    id: 'hp-01',
    name: '000 Subdomain Gateway (000.localhost)',
    url: 'http://000.localhost:3000',
    category: 'Gateway',
    status: 'operational',
    latencyMs: 8,
    uptime24h: 99.98,
    lastChecked: 'Just now',
    history: [8, 9, 7, 8, 12, 8, 7, 8, 9, 8]
  },
  {
    id: 'hp-02',
    name: 'Gemini AI Real-time Live API',
    url: 'https://generativelanguage.googleapis.com',
    category: 'AI Gateway',
    status: 'operational',
    latencyMs: 34,
    uptime24h: 99.95,
    lastChecked: 'Just now',
    history: [32, 38, 35, 41, 34, 33, 36, 34]
  },
  {
    id: 'hp-03',
    name: 'Cloud Run Production API Cluster',
    url: 'https://run.app',
    category: 'Microservices',
    status: 'operational',
    latencyMs: 24,
    uptime24h: 100.0,
    lastChecked: '1 min ago',
    history: [25, 24, 26, 23, 24, 28, 24, 24]
  },
  {
    id: 'hp-04',
    name: 'Cloud SQL / PostgreSQL Master',
    url: 'tcp://db-master:5432',
    category: 'Database',
    status: 'operational',
    latencyMs: 14,
    uptime24h: 99.99,
    lastChecked: 'Just now',
    history: [14, 15, 14, 13, 14, 16, 14, 14]
  },
  {
    id: 'hp-05',
    name: 'Staging E-Commerce Storefront',
    url: 'http://staging.000.localhost:3000',
    category: 'Web Store',
    status: 'degraded',
    latencyMs: 168,
    uptime24h: 96.40,
    lastChecked: '2 min ago',
    history: [120, 145, 160, 175, 190, 168]
  }
];

export const INITIAL_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'act-01',
    title: 'Purge Global Edge & CDN Cache',
    description: 'Invalidate all cached SSR pages, static assets and DNS routes instantly.',
    category: 'Cache Flush',
    type: 'diagnostic',
    commandSnippet: 'curl -X POST "http://000.localhost:3000/api/cache/purge" -H "Authorization: Bearer [VAULT_TOKEN]"'
  },
  {
    id: 'act-02',
    title: 'Trigger Staging Deploy Webhook',
    description: 'Dispatch immediate build and deploy pipeline on GitHub Actions.',
    category: 'Deploy Trigger',
    type: 'webhook',
    targetUrl: 'https://api.github.com/repos/org/000-control/dispatches',
    payload: { event_type: 'deploy_staging', ref: 'main' }
  },
  {
    id: 'act-03',
    title: 'Vault Cryptographic Health Audit',
    description: 'Scan all keys in the Vault for approaching expiration dates and weak entropy.',
    category: 'Audit',
    type: 'diagnostic'
  },
  {
    id: 'act-04',
    title: 'Emergency DEFCON Lockdown Test',
    description: 'Simulate instant session purge, clipboard clearing and zero-knowledge memory wipe.',
    category: 'Diagnostics',
    type: 'diagnostic'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2026-08-16 10:20:12',
    level: 'success',
    action: 'SYSTEM_BOOT',
    details: '000 Mission Control initialized on host 000.localhost:3000 with WebCrypto AES-GCM 256.',
    operator: 'KERNEL'
  },
  {
    id: 'log-02',
    timestamp: '2026-08-16 10:21:05',
    level: 'info',
    action: 'HOST_BIND',
    details: 'Subdomain handler successfully bound to *.000.localhost and 000.local.',
    operator: 'GATEWAY'
  },
  {
    id: 'log-03',
    timestamp: '2026-08-16 10:21:44',
    level: 'info',
    action: 'HEALTH_PROBE',
    details: '5/5 primary operational nodes responding with nominal latency (<35ms).',
    operator: 'POL_DAEMON'
  }
];
