import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { BootstrapConfig } from '../../../types/index.js';
import { resolveRulesForProject } from '../../catalog/index.js';
import {
  generateProject,
  generateMcpConfig,
  generateUniversalAIEcosystem,
} from '../../generators/index.js';
import {
  detectCurrentSetup,
  applyNormalization,
  auditProjectVersions,
  applyAuditedVersionUpdates,
  validateProjectPatterns,
} from '../index.js';

describe('modules/workflows (integration)', () => {
  it('normalizes an Orbit-style workspace while preserving project instructions', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-normalize-'));
    try {
      await fs.mkdir(path.join(dir, 'apps/desktop/src-tauri'), { recursive: true });
      await fs.mkdir(path.join(dir, '.ai/rules'), { recursive: true });
      for (const file of [
        'apps/desktop/tsconfig.json',
        'apps/desktop/src-tauri/Cargo.toml',
        'nx.json',
        'bun.lock',
      ]) {
        await fs.writeFile(path.join(dir, file), '');
      }
      await fs.writeFile(
        path.join(dir, 'apps/desktop/package.json'),
        JSON.stringify({ dependencies: { '@tauri-apps/api': '2' } }),
      );
      await fs.writeFile(path.join(dir, 'AGENTS.md'), 'local instructions');
      await fs.writeFile(path.join(dir, '.ai/rules/local.md'), 'local rule');
      expect(await detectCurrentSetup(dir)).toMatchObject({
        languages: ['typescript', 'rust'],
        packageManager: 'bun',
        frameworks: ['tauri'],
        workspace: { apps: [{ name: 'desktop', framework: 'tauri' }], packages: [] },
      });
      await applyNormalization(dir, ['codex'], []);
      expect(
        JSON.parse(await fs.readFile(path.join(dir, 'bootstrap.config.json'), 'utf8')).stack
          .monorepo,
      ).toBe(true);
      expect(await fs.readFile(path.join(dir, 'AGENTS.md'), 'utf8')).toBe('local instructions');
      expect(await fs.readFile(path.join(dir, '.ai/rules/local.md'), 'utf8')).toBe('local rule');
      await fs.writeFile(path.join(dir, 'bootstrap.config.json'), '{broken');
      await expect(applyNormalization(dir, ['codex'], [])).rejects.toThrow('bootstrap.config.json');
      expect(await fs.readFile(path.join(dir, 'bootstrap.config.json'), 'utf8')).toBe('{broken');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('detects polyglot Mobile + Go repo with ui-mobile, Nx, MCPs, and all 15 universal AI rules', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-wf-mobile-'));
    try {
      const config: BootstrapConfig = {
        version: '1.0.0',
        project: {
          name: 'omnicron-mobile',
          description: 'Mobile + Go API',
          author: 'bender',
          codeowners: true,
        },
        stack: {
          languages: ['typescript', 'golang'],
          packageManager: 'yarn',
          monorepo: true,
          useMakefiles: true,
          frameworks: ['react-native', 'nativewind', 'fiber'],
          tools: ['ai-memory'],
          agents: ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
        },
        workspace: {
          apps: [{ name: 'mobile', language: 'typescript', framework: 'react-native' }],
          packages: [],
        },
        architecture: {
          pattern: 'vertical-slice',
          folderOrganization: 'feature-based',
          fileNaming: 'snake_case',
          testOrganization: 'dedicated-tests',
          strictBoundaries: true,
          pathAliases: true,
          barrelExports: false,
          exampleModule: true,
        },
      };

      await expect(generateProject(tmpDir, config)).rejects.toThrow('not implemented');
      const supported = structuredClone(config);
      supported.workspace.apps = [];
      supported.stack.frameworks = ['fiber'];
      const res = await generateProject(tmpDir, supported);
      await fs.writeFile(path.join(tmpDir, 'bootstrap.config.json'), JSON.stringify(config));
      await generateUniversalAIEcosystem(tmpDir, config);
      await fs.mkdir(path.join(tmpDir, 'packages/ui-mobile'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, 'packages/ui-mobile/package.json'),
        JSON.stringify({ name: '@test/ui-mobile' }),
      );
      expect(res.uiPackagesCreated).toEqual([]);
      expect(res.filesCreated).toContain('nx.json');
      expect(res.filesCreated).not.toContain('Makefile');

      await generateMcpConfig(tmpDir, ['context7'], config.stack.agents);
      const detected = await detectCurrentSetup(tmpDir);
      expect(detected.rulesPresent).toHaveLength(resolveRulesForProject(config).length);
      expect(detected.rulesPresent).toContain('mobile-anti-patterns');
      expect(detected.rulesPresent).toContain('go-anti-patterns');
      expect(detected.rulesPresent).not.toContain('rust-anti-patterns');
      expect(detected.uiPackagesPresent).toEqual(['ui-mobile']);
      expect(detected.hasMcpConfig).toBe(true);
      expect(detected.mcpsConfigured).toContain('context7');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('normalizes legacy repos with chosen agent and audits/fixes vulnerable & unpinned deps', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-wf-norm-upd-'));
    try {
      await fs.writeFile(
        path.join(tmpDir, 'package.json'),
        JSON.stringify(
          {
            name: 'legacy-ship',
            dependencies: { next: '15.3.2' },
            devDependencies: { typescript: '^5.0.0' },
          },
          null,
          2,
        ),
        'utf-8',
      );
      await fs.writeFile(path.join(tmpDir, 'yarn.lock'), '# yarn lockfile\n', 'utf-8');

      const before = await detectCurrentSetup(tmpDir);
      expect(before.packageManager).toBe('yarn');
      expect(before.agents).toHaveLength(0);
      expect(before.rulesMissing.length).toBeGreaterThanOrEqual(9);

      const norm = await applyNormalization(
        tmpDir,
        ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
        ['ai-memory', 'security-checker', 'commitlint-husky-prettier', 'spaghetti-checker'],
        'antigravity',
        ['ai-memory', 'context7'],
      );
      expect(norm.normalizingAgent).toBe('antigravity');
      expect(norm.filesUpdated).toContain('.ai/normalization-plan.md');
      expect(norm.filesUpdated).toContain('mcp.json');

      const after = await detectCurrentSetup(tmpDir);
      expect(after.agents).toHaveLength(5);
      expect(after.rulesMissing).toHaveLength(0);
      expect(after.hasSecurityConfigs).toBe(true);
      expect(after.mcpsConfigured).toEqual(['ai-memory', 'context7']);

      const auditBefore = await auditProjectVersions(tmpDir);
      expect(auditBefore.find((i) => i.packageName === 'next')?.status).toBe('vulnerable');
      expect(auditBefore.find((i) => i.packageName === 'typescript')?.status).toBe('unpinned');

      expect(await applyAuditedVersionUpdates(tmpDir)).toBe(2);

      const auditAfter = await auditProjectVersions(tmpDir);
      expect(auditAfter.every((i) => i.status === 'ok')).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('validates clean repos and catches pattern violations (unpinned deps, unverified MCPs, doc sprawl, bad test placement, eval)', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-wf-validate-'));
    try {
      const config: BootstrapConfig = {
        version: '1.0.0',
        project: {
          name: 'clean-express',
          description: 'Pattern compliant project',
          author: 'leela',
          codeowners: true,
        },
        stack: {
          languages: ['typescript'],
          packageManager: 'yarn',
          monorepo: true,
          useMakefiles: false,
          frameworks: ['ink', 'vitest'],
          tools: ['ai-memory', 'security-checker'],
          agents: ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
          mcps: ['ai-memory', 'context7'],
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
          exampleModule: true,
        },
      };

      await generateProject(tmpDir, config);

      // 1. Clean project must pass ALL 8 pattern checks
      const cleanReport = await validateProjectPatterns(tmpDir);
      expect(cleanReport.passed).toBe(true);
      expect(cleanReport.failedChecks).toBe(0);

      // 2. Inject pattern violations across multiple rules
      await fs.writeFile(path.join(tmpDir, 'NOTES.md'), 'throwaway doc dump\n', 'utf-8');
      await fs.writeFile(
        path.join(tmpDir, 'mcp.json'),
        JSON.stringify({ mcpServers: { 'evil-unverified': { command: 'sh' } } }, null, 2),
        'utf-8',
      );
      await fs.mkdir(path.join(tmpDir, 'packages/ui-cli/src'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, 'packages/ui-cli/src/bad.test.ts'),
        'export const x = 1;\n',
        'utf-8',
      );
      await fs.writeFile(
        path.join(tmpDir, 'packages/ui-cli/src/unsafe.ts'),
        'export function run(s: string) { return eval(s); }\n',
        'utf-8',
      );

      const dirtyReport = await validateProjectPatterns(tmpDir);
      expect(dirtyReport.passed).toBe(false);
      const failedIds = dirtyReport.checks.filter((c) => !c.passed).map((c) => c.id);
      expect(failedIds).toEqual(
        expect.arrayContaining([
          'mcp-security-audit',
          'test-placement-pyramid',
          'ai-docs-discipline',
          'security-audit',
        ]),
      );
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
