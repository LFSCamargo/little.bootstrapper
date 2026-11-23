import { describe, it, expect } from 'vitest';
import {
  PACKAGE_MANAGERS,
  LANGUAGES,
  AI_AGENTS,
  ADDITIONAL_TOOLS,
  getCompatibleFrameworks,
  AUDITED_VERSIONS,
  isVersionPinned,
  getVulnerabilityAdvisory,
  VERIFIED_MCPS,
  searchVerifiedMcps,
  getVerifiedMcpById,
  recommendMcpsForProject,
  MARKETPLACE_RULES,
  searchMarketplaceRules,
  resolveRulesForProject,
} from '../index.js';
import type { BootstrapConfig } from '../../../types/index.js';
import { PLANET_EXPRESS_SHIP_ASCII, BENDER_MASCOT_ASCII } from '../../../assets/ascii/index.js';

describe('modules/catalog & assets/ascii (unit)', () => {
  it('covers all 4 package managers, 4 languages, 5 AI agents, and 12 tools/skills', () => {
    expect(PACKAGE_MANAGERS.map((p) => p.id)).toEqual(['yarn', 'npm', 'pnpm', 'bun']);
    expect(LANGUAGES.map((l) => l.id)).toEqual(['typescript', 'golang', 'rust', 'solidity']);
    expect(AI_AGENTS.map((a) => a.id)).toEqual([
      'opencode',
      'antigravity',
      'claude',
      'codex',
      'cursor',
    ]);
    expect(ADDITIONAL_TOOLS).toHaveLength(12);
  });

  it('enforces Elysia compatibility with Bun only', () => {
    const withYarn = getCompatibleFrameworks(['typescript'], 'yarn').map((f) => f.id);
    const withPnpm = getCompatibleFrameworks(['typescript'], 'pnpm').map((f) => f.id);
    const withBun = getCompatibleFrameworks(['typescript'], 'bun').map((f) => f.id);
    expect(withYarn).not.toContain('elysia');
    expect(withPnpm).not.toContain('elysia');
    expect(withBun).toContain('elysia');
  });

  it('guarantees strict pinning, zero CVEs in audited registry, and flags vulnerable Next.js', () => {
    for (const entry of Object.values(AUDITED_VERSIONS)) {
      expect(isVersionPinned(entry.version)).toBe(true);
      expect(entry.cveCount).toBe(0);
    }
    expect(getVulnerabilityAdvisory('next', '15.3.2')).toContain('CVE-2025-66478');
    expect(getVulnerabilityAdvisory('next', '15.5.29')).toBeNull();
    expect(PLANET_EXPRESS_SHIP_ASCII).toContain('SSt');
    expect(BENDER_MASCOT_ASCII).toContain('Silver Saks');
  });

  it('provides a verified safe MCP catalog (26 audited MCPs) with search, zero hardcoded secrets, and stack recommendations', () => {
    expect(VERIFIED_MCPS.length).toBeGreaterThanOrEqual(26);
    for (const mcp of VERIFIED_MCPS) {
      expect(mcp.verified).toBe(true);
      expect(mcp.securityNotes.length).toBeGreaterThan(5);
      if (mcp.config.env) {
        for (const val of Object.values(mcp.config.env)) {
          expect(val.startsWith('${') && val.endsWith('}')).toBe(true);
        }
      }
    }
    expect(searchVerifiedMcps('postgres').map((m) => m.id)).toContain('postgres');
    expect(searchVerifiedMcps('microsoft').map((m) => m.id)).toContain('playwright');
    expect(searchVerifiedMcps('nx').map((m) => m.id)).toContain('nx');
    expect(searchVerifiedMcps('stripe').map((m) => m.id)).toContain('stripe');
    expect(searchVerifiedMcps('', 'Databases').length).toBeGreaterThanOrEqual(5);
    expect(getVerifiedMcpById('context7')?.publisher).toBe('Upstash');
    expect(getVerifiedMcpById('unverified-malicious-mcp')).toBeUndefined();
  });

  it('provides searchable Rules Marketplace and resolves context-selective rules & MCPs per stack & domain', () => {
    expect(MARKETPLACE_RULES.length).toBeGreaterThanOrEqual(28);
    expect(searchMarketplaceRules('financial').map((r) => r.id)).toContain('financial-rules');
    expect(searchMarketplaceRules('mobile').map((r) => r.id)).toContain('mobile-anti-patterns');
    expect(searchMarketplaceRules('ink').map((r) => r.id)).toContain('ink-anti-patterns');
    expect(searchMarketplaceRules('nextjs').map((r) => r.id)).toContain('nextjs-anti-patterns');
    expect(searchMarketplaceRules('playwright').map((r) => r.id)).toContain(
      'playwright-testing-rules',
    );
    expect(searchMarketplaceRules('shadcn').map((r) => r.id)).toContain('shadcn-aceternity-rules');

    const base: BootstrapConfig = {
      version: '1.0.0',
      project: { name: 'ledger-cli', description: 'FinTech CLI', author: 'fry', codeowners: true },
      stack: {
        languages: ['typescript'],
        packageManager: 'yarn',
        monorepo: true,
        useMakefiles: false,
        frameworks: ['ink', 'nextjs', 'shadcn', 'playwright', 'drizzle'],
        tools: ['ai-memory'],
        agents: ['claude'],
        domains: ['financial'],
      },
      workspace: { apps: [], packages: [] },
      architecture: {
        pattern: 'modular',
        folderOrganization: 'module-based',
        fileNaming: 'kebab-case',
        testOrganization: 'dedicated-tests',
        strictBoundaries: true,
        pathAliases: true,
        barrelExports: true,
        exampleModule: false,
      },
    };

    const resolved = resolveRulesForProject(base);
    expect(resolved).toContain('typescript-rules');
    expect(resolved).toContain('nx-monorepo-rules');
    expect(resolved).toContain('ink-anti-patterns');
    expect(resolved).toContain('nextjs-anti-patterns');
    expect(resolved).toContain('shadcn-aceternity-rules');
    expect(resolved).toContain('playwright-testing-rules');
    expect(resolved).toContain('orm-database-rules');
    expect(resolved).toContain('financial-rules');
    expect(resolved).toContain('ai-docs-discipline');
    // Context-selective: must NOT pollute with unrelated languages/frameworks
    expect(resolved).not.toContain('rust-anti-patterns');
    expect(resolved).not.toContain('go-anti-patterns');
    expect(resolved).not.toContain('mobile-anti-patterns');

    const recommendedMcps = recommendMcpsForProject(base);
    expect(recommendedMcps).toEqual(
      expect.arrayContaining([
        'ai-memory',
        'context7',
        'nx',
        'nextjs-devtools',
        'shadcn',
        'playwright',
        'drizzle',
        'stripe',
        'postgres',
      ]),
    );
  });
});
