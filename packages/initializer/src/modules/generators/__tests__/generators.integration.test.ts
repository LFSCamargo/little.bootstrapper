import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { BootstrapConfig } from '../../../types/index.js';
import {
  generateProject,
  generateModule,
  generateMcpConfig,
  loadBootstrapConfig,
  resolveRequiredUiPackages,
} from '../index.js';

describe('modules/generators (integration)', () => {
  it('resolves and scaffolds only the separated UI packages matching selected frameworks', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-gen-cliweb-'));
    try {
      const config: BootstrapConfig = {
        version: '1.0.0',
        project: {
          name: 'planet-cli-web',
          description: 'CLI + Web only',
          author: 'leela',
          codeowners: true,
        },
        stack: {
          languages: ['typescript'],
          packageManager: 'yarn',
          monorepo: true,
          useMakefiles: false,
          frameworks: ['ink', 'nextjs', 'shadcn', 'aceternity-ui', 'vitest'],
          tools: [
            'ai-memory',
            'security-checker',
            'commitlint-husky-prettier',
            'commit-separately',
          ],
          agents: ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
        },
        workspace: {
          apps: [{ name: 'web', language: 'typescript', framework: 'nextjs' }],
          packages: [{ name: 'cli', language: 'typescript', framework: 'ink' }],
        },
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

      expect(resolveRequiredUiPackages(config)).toEqual(['ui-cli', 'ui-web']);
      const res = await generateProject(tmpDir, config);
      expect(res.uiPackagesCreated).toEqual(['ui-cli', 'ui-web']);
      expect(res.filesCreated).toContain('packages/ui-cli/package.json');
      expect(res.filesCreated).toContain('packages/ui-web/components.json');
      expect(res.filesCreated).toContain('.yarnrc.yml');
      expect(res.filesCreated).not.toContain('packages/ui-mobile/package.json');

      const uiCliPkg = JSON.parse(
        await fs.readFile(path.join(tmpDir, 'packages/ui-cli/package.json'), 'utf-8'),
      ) as { dependencies: Record<string, string> };
      expect(uiCliPkg.dependencies['@inkjs/ui']).toBe('2.0.0');
      const uiCliSrc = await fs.readFile(
        path.join(tmpDir, 'packages/ui-cli/src/index.ts'),
        'utf-8',
      );
      expect(uiCliSrc).toContain("from '@inkjs/ui'");

      const loaded = await loadBootstrapConfig(tmpDir);
      const modFiles = await generateModule(tmpDir, 'slurms-mackenzie', loaded!);
      expect(modFiles).toContain('src/modules/slurms-mackenzie/slurms-mackenzie.ts');
      expect(modFiles).toContain('src/modules/slurms-mackenzie/__tests__/slurms-mackenzie.test.ts');
      expect(modFiles).toContain('src/modules/slurms-mackenzie/index.ts');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('installs verified safe MCPs into mcp.json, adds .env.example vars, and rejects unverified MCPs', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-gen-mcps-'));
    try {
      const res = await generateMcpConfig(
        tmpDir,
        ['ai-memory', 'context7', 'github', 'postgres'],
        ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
      );
      expect(res.filesWritten).toContain('mcp.json');
      expect(res.filesWritten).toContain('.cursor/mcp.json');
      expect(res.filesWritten).toContain('.mcp.json');
      expect(res.filesWritten).toContain('.env.example');
      expect(res.envVarsAdded).toEqual(
        expect.arrayContaining(['GITHUB_PERSONAL_ACCESS_TOKEN', 'DATABASE_URL']),
      );

      await expect(generateMcpConfig(tmpDir, ['rogue-unverified-mcp' as never])).rejects.toThrow(
        /verified safe MCP catalog/,
      );
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('generates configurable Vitest and Jest coverage thresholds (enabled & disabled)', async () => {
    const tmpVitest = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-gen-cov-vitest-'));
    const tmpJest = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-gen-cov-jest-'));
    try {
      const vitestConfig: BootstrapConfig = {
        version: '1.0.0',
        project: {
          name: 'cov-vitest',
          description: 'Vitest 85%',
          author: 'amy',
          codeowners: false,
        },
        stack: {
          languages: ['typescript'],
          packageManager: 'yarn',
          monorepo: true,
          useMakefiles: false,
          frameworks: ['ink', 'nextjs', 'vitest'],
          tools: ['ai-memory'],
          agents: ['claude'],
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
        testing: { coverage: { enabled: true, threshold: 85 } },
      };

      const vRes = await generateProject(tmpVitest, vitestConfig);
      expect(vRes.filesCreated).toContain('vitest.config.ts');
      expect(vRes.filesCreated).toContain('packages/ui-cli/vitest.config.ts');
      expect(vRes.filesCreated).toContain('packages/ui-web/vitest.config.ts');

      const vCfgText = await fs.readFile(path.join(tmpVitest, 'vitest.config.ts'), 'utf-8');
      expect(vCfgText).toContain('lines: 85');
      expect(vCfgText).toContain('branches: 85');
      const vPkg = JSON.parse(await fs.readFile(path.join(tmpVitest, 'package.json'), 'utf-8')) as {
        scripts: Record<string, string>;
        devDependencies: Record<string, string>;
      };
      expect(vPkg.devDependencies['@vitest/coverage-v8']).toBe('3.1.1');
      expect(vPkg.scripts['test:coverage']).toBe('vitest run --coverage');

      const jestConfig: BootstrapConfig = {
        ...vitestConfig,
        project: { ...vitestConfig.project, name: 'cov-jest' },
        stack: {
          ...vitestConfig.stack,
          packageManager: 'pnpm',
          frameworks: ['jest', 'eslint', 'biome', 'oxc'],
        },
        testing: { coverage: { enabled: false, threshold: 60 } },
      };
      const jRes = await generateProject(tmpJest, jestConfig);
      expect(jRes.filesCreated).toContain('jest.config.ts');
      expect(jRes.filesCreated).toContain('pnpm-workspace.yaml');
      const jCfgText = await fs.readFile(path.join(tmpJest, 'jest.config.ts'), 'utf-8');
      expect(jCfgText).toContain('collectCoverage: false');
    } finally {
      await fs.rm(tmpVitest, { recursive: true, force: true });
      await fs.rm(tmpJest, { recursive: true, force: true });
    }
  });
});
