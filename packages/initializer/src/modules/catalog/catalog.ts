import type {
  AIAgent,
  AdditionalTool,
  Framework,
  Language,
  PackageManager,
} from '../../types/index.js';

export interface CatalogItem<T extends string = string> {
  id: T;
  label: string;
  description: string;
  category?: string;
  language?: Language;
  requiresPackageManager?: PackageManager;
  url?: string;
}

export const PACKAGE_MANAGERS: CatalogItem<PackageManager>[] = [
  { id: 'yarn', label: 'Yarn', description: 'Fast, reliable, and secure dependency management' },
  { id: 'npm', label: 'NPM', description: 'Default Node.js package manager' },
  { id: 'pnpm', label: 'PNPM', description: 'Fast, disk space efficient package manager' },
  { id: 'bun', label: 'Bun', description: 'All-in-one JavaScript runtime & package manager' },
];

export const LANGUAGES: CatalogItem<Language>[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    description: 'Typed JavaScript for web, APIs, CLI, and mobile',
  },
  { id: 'golang', label: 'Go (Golang)', description: 'Fast, compiled backend services and CLIs' },
  {
    id: 'rust',
    label: 'Rust',
    description: 'Systems programming, high-perf APIs, and smart contracts',
  },
  { id: 'solidity', label: 'Solidity', description: 'EVM smart contract development' },
];

export const AI_AGENTS: CatalogItem<AIAgent>[] = [
  {
    id: 'opencode',
    label: 'Open Code',
    description: 'AGENTS.md + .opencode/ universal rules & skills',
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    description: '.agent/rules + .agent/skills + .agent/workflows',
  },
  { id: 'claude', label: 'Claude', description: 'CLAUDE.md + .claude/rules + .claude/skills' },
  { id: 'codex', label: 'Codex', description: 'AGENTS.md + .codex/ instructions & skills' },
  { id: 'cursor', label: 'Cursor', description: '.cursor/rules/*.mdc universal rules' },
];

export const FRAMEWORKS: CatalogItem<Framework>[] = [
  // TypeScript — Apps & UI
  {
    id: 'ink',
    label: 'Ink',
    description: 'React framework for building CLIs',
    category: 'App / CLI',
    language: 'typescript',
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    description: 'React framework for web applications',
    category: 'Web',
    language: 'typescript',
  },
  {
    id: 'react-vite',
    label: 'React Vite',
    description: 'Simple barebones React + Vite setup',
    category: 'Web',
    language: 'typescript',
  },
  {
    id: 'nuxtjs',
    label: 'Nuxt.js',
    description: 'Vue framework for building websites',
    category: 'Web',
    language: 'typescript',
  },
  {
    id: 'tauri',
    label: 'Tauri',
    description: 'Rust & React desktop apps',
    category: 'Desktop',
    language: 'typescript',
  },
  {
    id: 'react-native',
    label: 'React Native',
    description: 'Mobile applications',
    category: 'Mobile',
    language: 'typescript',
  },
  {
    id: 'lynx',
    label: 'Lynx',
    description: 'Mobile applications and more',
    category: 'Mobile',
    language: 'typescript',
  },

  // TypeScript — REST APIs
  {
    id: 'elysia',
    label: 'Elysia',
    description: 'REST API framework (Bun only)',
    category: 'REST API',
    language: 'typescript',
    requiresPackageManager: 'bun',
  },
  {
    id: 'express',
    label: 'Express',
    description: 'Minimalist REST API framework',
    category: 'REST API',
    language: 'typescript',
  },
  {
    id: 'koa',
    label: 'Koa',
    description: 'Expressive middleware REST API framework',
    category: 'REST API',
    language: 'typescript',
  },
  {
    id: 'fastify',
    label: 'Fastify',
    description: 'Fast and low overhead web framework',
    category: 'REST API',
    language: 'typescript',
  },
  {
    id: 'hono',
    label: 'Hono',
    description: 'Ultrafast edge-ready REST API framework',
    category: 'REST API',
    language: 'typescript',
  },

  // TypeScript — Testing
  {
    id: 'vitest',
    label: 'Vitest',
    description: 'Next generation test runner',
    category: 'Testing',
    language: 'typescript',
  },
  {
    id: 'jest',
    label: 'Jest',
    description: 'Delightful JavaScript testing',
    category: 'Testing',
    language: 'typescript',
  },
  {
    id: 'playwright',
    label: 'Playwright',
    description: 'E2E headless browser testing suite',
    category: 'Testing',
    language: 'typescript',
  },

  // TypeScript — Linting & Formatting
  {
    id: 'eslint',
    label: 'ESLint',
    description: 'Pluggable JavaScript/TypeScript linter',
    category: 'Lint/Format',
    language: 'typescript',
  },
  {
    id: 'biome',
    label: 'Biome',
    description: 'Fast unified linter & formatter',
    category: 'Lint/Format',
    language: 'typescript',
  },
  {
    id: 'oxc',
    label: 'OXC',
    description: 'High-performance oxidation linter',
    category: 'Lint/Format',
    language: 'typescript',
  },
  {
    id: 'prettier',
    label: 'Prettier',
    description: 'Opinionated code formatter',
    category: 'Lint/Format',
    language: 'typescript',
  },

  // TypeScript — ORMs / ODMs
  {
    id: 'kysely',
    label: 'Kysely',
    description: 'Type-safe SQL query builder',
    category: 'ORM/ODM',
    language: 'typescript',
  },
  {
    id: 'drizzle',
    label: 'Drizzle',
    description: 'TypeScript SQL ORM',
    category: 'ORM/ODM',
    language: 'typescript',
  },
  {
    id: 'typeorm',
    label: 'TypeORM',
    description: 'Typesafe ORM for SQL / NoSQL',
    category: 'ORM/ODM',
    language: 'typescript',
  },
  {
    id: 'mongoose',
    label: 'Mongoose',
    description: 'MongoDB object modeling (ODM)',
    category: 'ORM/ODM',
    language: 'typescript',
  },

  // Web Marketing Design Systems
  {
    id: 'aceternity-ui',
    label: 'Aceternity UI',
    description: 'Marketing UI components (Pro keys via .env)',
    category: 'Marketing DS',
    language: 'typescript',
  },
  {
    id: 'inspira-ui',
    label: 'Inspira UI',
    description: 'Vue/Web marketing & design system components',
    category: 'Marketing DS',
    language: 'typescript',
  },
  {
    id: 'magic-ui',
    label: 'Magic UI',
    description: 'Animated marketing design system components',
    category: 'Marketing DS',
    language: 'typescript',
  },

  // Web Design Systems
  {
    id: 'shadcn',
    label: 'ShadCN',
    description: 'Accessible composable React UI components',
    category: 'Web DS',
    language: 'typescript',
  },
  {
    id: 'park-ui',
    label: 'Park UI',
    description: 'Multi-framework design system components',
    category: 'Web DS',
    language: 'typescript',
  },

  // Animations
  {
    id: 'framer-motion',
    label: 'Framer Motion',
    description: 'React web animations',
    category: 'Animations',
    language: 'typescript',
  },
  {
    id: 'motion',
    label: 'Motion & Motion AI',
    description: 'React & Vue web animations',
    category: 'Animations',
    language: 'typescript',
  },

  // Mobile CSS
  {
    id: 'nativewind',
    label: 'NativeWind',
    description: 'Tailwind CSS for React Native',
    category: 'Mobile CSS',
    language: 'typescript',
  },
  {
    id: 'stylesheets',
    label: 'StyleSheets',
    description: 'React Native built-in StyleSheet API',
    category: 'Mobile CSS',
    language: 'typescript',
  },
  {
    id: 'uniwind',
    label: 'UniWind',
    description: 'Universal Tailwind bindings for mobile',
    category: 'Mobile CSS',
    language: 'typescript',
  },
  {
    id: 'unistyles',
    label: 'UniStyles',
    description: 'High-performance cross-platform mobile styles',
    category: 'Mobile CSS',
    language: 'typescript',
  },
  {
    id: 'tamagui',
    label: 'Tamagui',
    description: 'Universal React Native + Web UI & styling',
    category: 'Mobile CSS',
    language: 'typescript',
  },

  // CSS
  {
    id: 'tailwindcss',
    label: 'TailwindCSS',
    description: 'Utility-first CSS framework',
    category: 'CSS',
    language: 'typescript',
  },
  {
    id: 'stylex',
    label: 'StyleX',
    description: 'Atomic CSS-in-JS by Meta',
    category: 'CSS',
    language: 'typescript',
  },
  {
    id: 'styled-components',
    label: 'Styled Components',
    description: 'CSS-in-JS component styling',
    category: 'CSS',
    language: 'typescript',
  },
  {
    id: 'sass',
    label: 'Sass',
    description: 'CSS with superpowers',
    category: 'CSS',
    language: 'typescript',
  },
  {
    id: 'pure-css',
    label: 'Pure CSS',
    description: 'Zero-runtime standard CSS',
    category: 'CSS',
    language: 'typescript',
  },

  // GoLang
  {
    id: 'fiber',
    label: 'Fiber',
    description: 'Express-inspired Go REST API framework',
    category: 'Go REST API',
    language: 'golang',
  },
  {
    id: 'gin',
    label: 'Gin',
    description: 'High-performance Go HTTP web framework',
    category: 'Go REST API',
    language: 'golang',
  },
  {
    id: 'chi',
    label: 'Chi',
    description: 'Lightweight idiomatic Go router',
    category: 'Go REST API',
    language: 'golang',
  },
  {
    id: 'echo',
    label: 'Echo',
    description: 'Minimalist Go REST API framework',
    category: 'Go REST API',
    language: 'golang',
  },

  // Rust
  {
    id: 'anchor',
    label: 'Anchor',
    description: 'Solana smart contracts framework',
    category: 'Rust Smart Contracts',
    language: 'rust',
  },
  {
    id: 'soroban-sdk',
    label: 'SorobanSDK',
    description: 'Stellar smart contracts SDK',
    category: 'Rust Smart Contracts',
    language: 'rust',
  },
  {
    id: 'near-sdk',
    label: 'NearSDK',
    description: 'Near smart contracts SDK',
    category: 'Rust Smart Contracts',
    language: 'rust',
  },
  {
    id: 'stylus-sdk',
    label: 'StylusSDK',
    description: 'Arbitrum EVM smart contracts SDK',
    category: 'Rust Smart Contracts',
    language: 'rust',
  },
  {
    id: 'axum',
    label: 'Axum',
    description: 'Ergonomic Rust REST API framework',
    category: 'Rust REST API',
    language: 'rust',
  },
  {
    id: 'hyper',
    label: 'Hyper',
    description: 'Fast low-level Rust HTTP framework',
    category: 'Rust REST API',
    language: 'rust',
  },

  // Solidity
  {
    id: 'foundry',
    label: 'Foundry',
    description: 'Blazing fast Rust-based Solidity toolkit',
    category: 'Solidity',
    language: 'solidity',
  },
  {
    id: 'hardhat',
    label: 'Hardhat',
    description: 'Ethereum development environment',
    category: 'Solidity',
    language: 'solidity',
  },
];

export const ADDITIONAL_TOOLS: CatalogItem<AdditionalTool>[] = [
  {
    id: 'ai-memory',
    label: 'AI Memory',
    description: 'Persistent cross-session memory for AI agents',
    url: 'https://github.com/akitaonrails/ai-memory',
  },
  {
    id: 'commitlint-husky-prettier',
    label: 'CommitLint + Husky + Prettier',
    description: 'Conventional commits, git hooks, and code formatting',
  },
  {
    id: 'security-checker',
    label: 'Security Checker (OpenGrep + GitLeaks)',
    description: 'Static security analysis and secret scanning',
  },
  {
    id: 'spaghetti-checker',
    label: 'Spaghetti Checker (arborist-metrics)',
    description: 'Codebase complexity and spaghetti detection',
    url: 'https://github.com/StrangeDaysTech/arborist-metrics',
  },
  {
    id: 'complexity-checker',
    label: 'O(1) Complexity Checker',
    description: 'Flags high algorithmic time/space complexity hotspots',
  },
  {
    id: 'n-plus-one-checker',
    label: 'N+1 SQL Queries Checker',
    description: 'Analyzes execution layers to catch N+1 SQL query smells',
  },
  {
    id: 'commit-separately',
    label: 'Commit Separately Skill',
    description: 'Splits working tree changes into clean, logical PR commits',
  },
  {
    id: 'financial-audit',
    label: 'Financial Audit Skill',
    description: 'Scans for float money bugs, missing idempotency keys & mutable ledgers',
  },
  {
    id: 'docs-pruner',
    label: 'Docs Pruner (Anti-Doc-Sprawl)',
    description: 'Audits markdown files to eliminate doc sprawl and bloated AI rules',
  },
  {
    id: 'nx-workspace-audit',
    label: 'NX Workspace Audit Skill',
    description: 'Audits NX boundaries, project.json targets & cross-package imports',
  },
  {
    id: 'playwright-e2e-author',
    label: 'Playwright E2E Author Skill',
    description: 'Writes flake-free Playwright E2E specs with accessible locators',
  },
  {
    id: 'mcp-security-audit',
    label: 'MCP Security Audit Skill',
    description: 'Audits mcp.json for verified servers, read-only scopes & zero secrets',
  },
];

export const PROJECT_DOMAINS = [
  {
    id: 'general',
    label: 'General Software',
    description: 'Standard web, API, CLI, or mobile apps',
  },
  {
    id: 'financial',
    label: 'Financial / FinTech / Ledger',
    description: 'Strict decimal/minor-unit money, double-entry ledger, idempotency & PCI rules',
  },
  {
    id: 'web3',
    label: 'Web3 / Smart Contracts',
    description: 'On-chain protocols, CEI, fuzzing & oracle rules',
  },
  {
    id: 'saas',
    label: 'SaaS / Multi-Tenant',
    description: 'Tenant isolation, auth & API boundary rules',
  },
  {
    id: 'devtools',
    label: 'Developer Tools / CLI',
    description: 'Terminal ergonomics, Ink & modular CLI rules',
  },
] as const;

export function getCompatibleFrameworks(
  languages: Language[],
  packageManager: PackageManager,
): CatalogItem<Framework>[] {
  return FRAMEWORKS.filter((fw) => {
    if (fw.language && !languages.includes(fw.language)) {
      return false;
    }
    if (fw.requiresPackageManager && fw.requiresPackageManager !== packageManager) {
      return false;
    }
    return true;
  });
}
