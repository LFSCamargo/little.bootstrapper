import type { AuditedPackageVersion } from '../../types/index.js';

const AUDITED_DATE = '2026-11-23';

function audited(name: string, version: string): AuditedPackageVersion {
  return { name, version, auditedAt: AUDITED_DATE, status: 'audited', cveCount: 0 };
}

/**
 * Known vulnerable versions flagged immediately by the Update Helper.
 */
export const KNOWN_VULNERABLE_VERSIONS: Record<string, { versions: string[]; advisory: string }> = {
  next: {
    versions: ['15.3.0', '15.3.1', '15.3.2', '15.3.3', '15.3.4', '15.3.5'],
    advisory: 'CVE-2025-66478 — Upgrade to patched audited release 15.5.29',
  },
};

/**
 * Exact pinned, audited versions registry.
 * No caret (^) or tilde (~) ranges are allowed in bootstrapped projects.
 */
export const AUDITED_VERSIONS: Record<string, AuditedPackageVersion> = {
  // Core & Monorepo
  nx: audited('nx', '20.8.2'),
  '@nx-go/nx-go': audited('@nx-go/nx-go', '3.3.1'),
  '@monodon/rust': audited('@monodon/rust', '2.3.0'),
  typescript: audited('typescript', '5.8.3'),
  tsx: audited('tsx', '4.23.15'),
  '@types/node': audited('@types/node', '22.14.0'),
  '@types/react': audited('@types/react', '19.3.0'),
  '@types/react-dom': audited('@types/react-dom', '19.3.0'),

  // React & Ink
  react: audited('react', '19.3.1'),
  'react-dom': audited('react-dom', '19.3.1'),
  'react-test-renderer': audited('react-test-renderer', '19.3.1'),
  '@types/react-test-renderer': audited('@types/react-test-renderer', '19.3.1'),
  ink: audited('ink', '6.8.0'),
  '@inkjs/ui': audited('@inkjs/ui', '2.0.0'),
  'ink-select-input': audited('ink-select-input', '6.0.0'),
  'ink-spinner': audited('ink-spinner', '5.0.0'),
  'ink-text-input': audited('ink-text-input', '6.0.0'),
  chalk: audited('chalk', '5.4.1'),
  zod: audited('zod', '4.6.7'),

  // Web Frameworks (Next.js 15.5.29 patches CVE-2025-66478)
  next: audited('next', '15.5.29'),
  vite: audited('vite', '6.2.5'),
  nuxt: audited('nuxt', '3.16.2'),
  '@tauri-apps/api': audited('@tauri-apps/api', '2.5.0'),
  'react-native': audited('react-native', '0.79.1'),

  // REST APIs
  elysia: audited('elysia', '1.2.25'),
  express: audited('express', '5.1.0'),
  '@types/express': audited('@types/express', '5.0.1'),
  koa: audited('koa', '2.16.1'),
  '@types/koa': audited('@types/koa', '2.15.0'),
  fastify: audited('fastify', '5.3.2'),
  hono: audited('hono', '4.7.7'),
  '@hono/node-server': audited('@hono/node-server', '1.14.1'),

  // Testing
  vitest: audited('vitest', '3.1.1'),
  '@vitest/coverage-v8': audited('@vitest/coverage-v8', '3.1.1'),
  jest: audited('jest', '29.7.0'),
  '@playwright/test': audited('@playwright/test', '1.58.2'),

  // Linting & Formatting
  eslint: audited('eslint', '9.25.1'),
  '@typescript-eslint/parser': audited('@typescript-eslint/parser', '8.31.0'),
  'vue-tsc': audited('vue-tsc', '2.2.8'),
  vue: audited('vue', '3.5.13'),
  '@biomejs/biome': audited('@biomejs/biome', '1.9.4'),
  oxlint: audited('oxlint', '0.16.7'),
  prettier: audited('prettier', '3.5.3'),

  // ORMs / ODMs
  kysely: audited('kysely', '0.28.2'),
  'drizzle-orm': audited('drizzle-orm', '0.43.1'),
  typeorm: audited('typeorm', '0.3.23'),
  mongoose: audited('mongoose', '8.14.0'),

  // ShadCN, Radix, Aceternity UI, Styling & Animations
  '@radix-ui/react-accordion': audited('@radix-ui/react-accordion', '1.2.11'),
  '@radix-ui/react-separator': audited('@radix-ui/react-separator', '1.1.7'),
  '@radix-ui/react-slot': audited('@radix-ui/react-slot', '1.2.3'),
  '@radix-ui/react-tabs': audited('@radix-ui/react-tabs', '1.1.12'),
  'class-variance-authority': audited('class-variance-authority', '0.7.1'),
  tailwindcss: audited('tailwindcss', '4.1.4'),
  '@tailwindcss/postcss': audited('@tailwindcss/postcss', '4.1.4'),
  postcss: audited('postcss', '8.5.3'),
  'framer-motion': audited('framer-motion', '12.43.0'),
  motion: audited('motion', '12.43.0'),
  'lucide-react': audited('lucide-react', '0.503.0'),
  clsx: audited('clsx', '2.1.1'),
  'tailwind-merge': audited('tailwind-merge', '3.2.0'),
  'styled-components': audited('styled-components', '6.1.17'),
  sass: audited('sass', '1.87.0'),
  nativewind: audited('nativewind', '4.1.23'),
  tamagui: audited('tamagui', '1.125.14'),

  // Git & Quality Tools
  husky: audited('husky', '9.1.7'),
  '@commitlint/cli': audited('@commitlint/cli', '19.8.1'),
  '@commitlint/config-conventional': audited('@commitlint/config-conventional', '19.8.1'),

  // Solidity
  hardhat: audited('hardhat', '2.23.0'),
};

export function getPinnedVersion(pkgName: string): string {
  const entry = AUDITED_VERSIONS[pkgName];
  if (!entry) {
    throw new Error(`Package "${pkgName}" is not in the audited versions registry.`);
  }
  return entry.version;
}

export function isVersionPinned(versionSpec: string): boolean {
  if (!versionSpec || versionSpec.startsWith('workspace:')) return true;
  return !/^[~^><=*]/.test(versionSpec.trim());
}

export function getVulnerabilityAdvisory(pkgName: string, versionSpec: string): string | null {
  const entry = KNOWN_VULNERABLE_VERSIONS[pkgName];
  if (!entry) return null;
  const cleaned = versionSpec.trim().replace(/^[~^]/, '');
  return entry.versions.includes(cleaned) ? entry.advisory : null;
}
