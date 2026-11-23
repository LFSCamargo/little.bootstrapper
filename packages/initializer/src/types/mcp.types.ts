export type McpCategory =
  | 'Memory & Knowledge'
  | 'Docs & Context'
  | 'Browser & Testing'
  | 'Code & Git'
  | 'Monorepo & Build'
  | 'Frameworks & DevTools'
  | 'Databases'
  | 'UI & Design'
  | 'Payments & FinTech'
  | 'Cloud & Infra'
  | 'Project Management';

export type McpServerId =
  | 'ai-memory'
  | 'context7'
  | 'playwright'
  | 'shadcn'
  | 'nx'
  | 'nextjs-devtools'
  | 'nuxt'
  | 'tailwind'
  | 'magic-ui'
  | 'eslint'
  | 'drizzle'
  | 'mongodb'
  | 'tauri'
  | 'stripe'
  | 'github'
  | 'linear'
  | 'filesystem'
  | 'memory'
  | 'sequential-thinking'
  | 'fetch'
  | 'postgres'
  | 'sqlite'
  | 'supabase'
  | 'neon'
  | 'sentry'
  | 'cloudflare';

export interface McpServerJsonEntry {
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface VerifiedMcpServer {
  id: McpServerId;
  name: string;
  category: McpCategory;
  description: string;
  publisher: string;
  verified: true;
  auditedAt: string;
  securityNotes: string;
  relatedTechs: string[];
  sourceUrl: string;
  transport: 'stdio' | 'http';
  requiredEnvVars: string[];
  config: McpServerJsonEntry;
}
