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
          apps: [
            { name: 'web', language: 'typescript', framework: 'nextjs', kind: 'web' },
            { name: 'cli', language: 'typescript', framework: 'ink', kind: 'cli' },
          ],
          packages: [],
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

      expect(resolveRequiredUiPackages(config)).toEqual(['ui-web']);
      const res = await generateProject(tmpDir, config);
      expect(res.uiPackagesCreated).toEqual(['ui-web']);
      expect(res.filesCreated).not.toContain('packages/ui-cli/package.json');
      expect(res.filesCreated).toContain('packages/ui-web/components.json');
      expect(res.filesCreated).toContain('.yarnrc.yml');
      expect(res.filesCreated).toContain('.yarn/releases/yarn-4.19.0.cjs');
      const yarnrc = await fs.readFile(path.join(tmpDir, '.yarnrc.yml'), 'utf-8');
      expect(yarnrc).toContain('yarnPath: .yarn/releases/yarn-4.19.0.cjs');
      expect(res.filesCreated).not.toContain('packages/ui-mobile/package.json');

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
      await fs.mkdir(path.join(tmpDir, '.cursor'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, '.cursor/mcp.json'),
        JSON.stringify({ custom: true, mcpServers: { local: { command: 'custom' } } }),
      );
      const res = await generateMcpConfig(
        tmpDir,
        ['ai-memory', 'context7', 'github', 'postgres'],
        ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
      );
      expect(
        JSON.parse(await fs.readFile(path.join(tmpDir, '.cursor/mcp.json'), 'utf8')),
      ).toMatchObject({ custom: true, mcpServers: { local: { command: 'custom' } } });
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

  it('generates configurable Vitest coverage and rejects unsupported Jest templates', async () => {
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
        workspace: {
          apps: [
            { name: 'cli', language: 'typescript', framework: 'ink', kind: 'cli' },
            { name: 'web', language: 'typescript', framework: 'nextjs', kind: 'web' },
          ],
          packages: [],
        },
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
      expect(vRes.filesCreated).not.toContain('packages/ui-cli/vitest.config.ts');
      expect(vRes.filesCreated).toContain('packages/ui-web/vitest.config.ts');

      const vCfgText = await fs.readFile(path.join(tmpVitest, 'vitest.config.ts'), 'utf-8');
      expect(vCfgText).toContain('lines: 85');
      expect(vCfgText).toContain('branches: 85');
      const vPkg = JSON.parse(await fs.readFile(path.join(tmpVitest, 'package.json'), 'utf-8')) as {
        scripts: Record<string, string>;
        devDependencies: Record<string, string>;
      };
      expect(vPkg.devDependencies['@vitest/coverage-v8']).toBe('3.1.1');
      expect(vPkg.scripts['test:coverage']).toBe('nx run-many -t test');

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
      await expect(generateProject(tmpJest, jestConfig)).rejects.toThrow(
        'Jest templates are not implemented',
      );
      jestConfig.stack.frameworks = [];
      const disabled = await generateProject(tmpJest, jestConfig);
      expect(disabled.filesCreated).toContain('vitest.config.ts');
      expect(disabled.filesCreated).toContain('pnpm-workspace.yaml');
      expect(await fs.readFile(path.join(tmpJest, 'vitest.config.ts'), 'utf8')).toContain(
        'enabled: false',
      );
    } finally {
      await fs.rm(tmpVitest, { recursive: true, force: true });
      await fs.rm(tmpJest, { recursive: true, force: true });
    }
  });

  it('scaffolds full starter product (Backend /health, Contracts, Web Sample App), root-only linter + Prettier, and outside pipeline', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-gen-product-'));
    try {
      const config: BootstrapConfig = {
        version: '1.0.0',
        project: {
          name: 'nimbus-starter',
          description: 'Full starter product monorepo',
          author: 'leela',
          codeowners: true,
        },
        stack: {
          languages: ['typescript', 'golang', 'rust', 'solidity'],
          packageManager: 'yarn',
          monorepo: true,
          useMakefiles: true,
          linter: 'biome',
          prettier: true,
          frameworks: ['hono', 'nextjs', 'vitest', 'shadcn'],
          tools: ['security-checker', 'commitlint-husky-prettier'],
          agents: ['claude', 'cursor'],
        },
        workspace: {
          apps: [
            { name: 'api', language: 'typescript', framework: 'hono', kind: 'backend' },
            { name: 'web', language: 'typescript', framework: 'nextjs', kind: 'web' },
            { name: 'express-svc', language: 'typescript', framework: 'express', kind: 'backend' },
            { name: 'fastify-svc', language: 'typescript', framework: 'fastify', kind: 'backend' },
            { name: 'koa-svc', language: 'typescript', framework: 'koa', kind: 'backend' },
            { name: 'go-svc', language: 'golang', framework: 'gin', kind: 'backend' },
            { name: 'rust-svc', language: 'rust', framework: 'axum', kind: 'backend' },
            { name: 'vite-portal', language: 'typescript', framework: 'react-vite', kind: 'web' },
          ],
          packages: [
            { name: 'contracts', language: 'typescript', framework: 'vitest', kind: 'contracts' },
            { name: 'go-lib', language: 'golang', framework: 'chi', kind: 'library' },
            { name: 'rust-lib', language: 'rust', framework: 'hyper', kind: 'library' },
            { name: 'evm-kit', language: 'solidity', framework: 'foundry', kind: 'library' },
          ],
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

      const res = await generateProject(tmpDir, config);

      // Root-only linter (biome) + root Prettier default + tsconfig.base.json
      expect(res.filesCreated).toContain('tsconfig.base.json');
      expect(res.filesCreated).toContain('biome.json');
      expect(res.filesCreated).toContain('.prettierrc');
      expect(res.filesCreated).toContain('.prettierignore');
      expect(res.filesCreated).not.toContain('apps/api/biome.json');
      expect(res.filesCreated).not.toContain('packages/contracts/.prettierrc');

      // Outside pipeline & docs
      expect(res.filesCreated).toContain('scripts/pipeline.sh');
      expect(res.filesCreated).toContain('docs/PIPELINE.md');

      // Initialized Contracts, Backend Health Endpoint, and Web Sample App
      expect(res.filesCreated).toContain('packages/contracts/package.json');
      expect(res.filesCreated).toContain('packages/contracts/src/health.contract.ts');
      expect(res.filesCreated).toContain(
        'packages/contracts/src/__tests__/health.contract.test.ts',
      );
      expect(res.filesCreated).toContain('apps/api/package.json');
      expect(res.filesCreated).toContain('apps/api/src/app.ts');
      expect(res.filesCreated).toContain('apps/api/src/__tests__/health.test.ts');
      expect(res.filesCreated).toContain('apps/web/package.json');
      expect(res.filesCreated).toContain('apps/web/src/app/layout.tsx');
      expect(res.filesCreated).toContain('apps/web/src/app/page.tsx');
      expect(res.filesCreated).toContain('apps/web/src/app.tsx');

      // Polyglot per-workspace initialization
      expect(res.filesCreated).toContain('apps/go-svc/main.go');
      expect(res.filesCreated).toContain('apps/rust-svc/Cargo.toml');
      expect(res.filesCreated).toContain('packages/evm-kit/src/SampleContract.sol');

      const apiPkg = JSON.parse(
        await fs.readFile(path.join(tmpDir, 'apps/api/package.json'), 'utf-8'),
      ) as { dependencies: Record<string, string> };
      expect(apiPkg.dependencies['@nimbus-starter/contracts']).toBe('workspace:*');
      expect(apiPkg.dependencies.hono).toBe('4.7.7');

      const webLayout = await fs.readFile(
        path.join(tmpDir, 'apps/web/src/app/layout.tsx'),
        'utf-8',
      );
      expect(webLayout).toContain('metadataBase');
      expect(webLayout).toContain('suppressHydrationWarning');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
