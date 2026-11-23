export type PackageManager = 'yarn' | 'npm' | 'pnpm' | 'bun';

export type Language = 'typescript' | 'golang' | 'rust' | 'solidity';

export type AIAgent = 'opencode' | 'antigravity' | 'claude' | 'codex' | 'cursor';

export type UiPackageKind = 'ui-cli' | 'ui-web' | 'ui-mobile';

export type TypeScriptFramework =
  | 'ink'
  | 'nextjs'
  | 'react-vite'
  | 'nuxtjs'
  | 'tauri'
  | 'react-native'
  | 'lynx'
  | 'elysia'
  | 'express'
  | 'koa'
  | 'fastify'
  | 'hono'
  | 'vitest'
  | 'jest'
  | 'playwright'
  | 'eslint'
  | 'biome'
  | 'oxc'
  | 'prettier'
  | 'kysely'
  | 'drizzle'
  | 'typeorm'
  | 'mongoose'
  | 'aceternity-ui'
  | 'inspira-ui'
  | 'magic-ui'
  | 'shadcn'
  | 'park-ui'
  | 'motion'
  | 'framer-motion'
  | 'nativewind'
  | 'stylesheets'
  | 'uniwind'
  | 'unistyles'
  | 'tamagui'
  | 'tailwindcss'
  | 'stylex'
  | 'styled-components'
  | 'sass'
  | 'pure-css';

export type GoFramework = 'fiber' | 'gin' | 'chi' | 'echo';

export type RustFramework = 'anchor' | 'soroban-sdk' | 'near-sdk' | 'stylus-sdk' | 'axum' | 'hyper';

export type SolidityFramework = 'foundry' | 'hardhat';

export type Framework = TypeScriptFramework | GoFramework | RustFramework | SolidityFramework;

export type AdditionalTool =
  | 'ai-memory'
  | 'commitlint-husky-prettier'
  | 'security-checker'
  | 'spaghetti-checker'
  | 'complexity-checker'
  | 'n-plus-one-checker'
  | 'commit-separately'
  | 'financial-audit'
  | 'docs-pruner'
  | 'nx-workspace-audit'
  | 'playwright-e2e-author'
  | 'mcp-security-audit';

export type ProjectDomain = 'general' | 'financial' | 'web3' | 'saas' | 'devtools';

export type RuleCategory = 'Core' | 'Framework' | 'Language' | 'Domain';

export type MarketplaceRuleId =
  | 'quality-gating'
  | 'security'
  | 'test-driven'
  | 'regression-testing'
  | 'e2e-testing'
  | 'project-architecture'
  | 'project-overview'
  | 'docs-sync'
  | 'ai-docs-discipline'
  | 'web-ui-components'
  | 'mobile-ui-components'
  | 'cli-ui-components'
  | 'typescript-rules'
  | 'go-anti-patterns'
  | 'rust-anti-patterns'
  | 'solidity-anti-patterns'
  | 'ink-anti-patterns'
  | 'nextjs-anti-patterns'
  | 'mobile-anti-patterns'
  | 'rest-api-anti-patterns'
  | 'smart-contracts-anti-patterns'
  | 'nx-monorepo-rules'
  | 'shadcn-aceternity-rules'
  | 'playwright-testing-rules'
  | 'orm-database-rules'
  | 'nuxt-vue-anti-patterns'
  | 'tauri-desktop-rules'
  | 'financial-rules';

export interface MarketplaceRule {
  id: MarketplaceRuleId;
  name: string;
  category: RuleCategory;
  description: string;
  templatePath: string;
  tags: string[];
  body: string;
}

export interface WorkspaceEntry {
  name: string;
  language: Language;
  framework: Framework;
}

export interface ProjectInfo {
  name: string;
  description: string;
  author: string;
  codeowners: boolean;
}
