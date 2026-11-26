import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject, generateModule } from '../index.js';
import { defaultWorkspaces, reconcileWorkspaces } from '../../catalog/index.js';
import { backendConfig } from './fixtures/backend-config.js';

async function temporary(check: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'safe-init-'));
  try {
    await check(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe('initialization audit regressions', () => {
  it('leaves a clean destination after a late failure and preserves its identity on retry', async () =>
    temporary(async (dir) => {
      const before = await fs.stat(dir);
      const config = backendConfig('axum');
      config.stack.mcps = ['unknown' as never];
      await expect(generateProject(dir, config)).rejects.toThrow('MCP');
      expect(await fs.readdir(dir)).toEqual([]);
      config.stack.mcps = [];
      await generateProject(dir, config);
      expect((await fs.stat(dir)).ino).toBe(before.ino);
    }));
  it('refuses to overwrite existing files before writing config or source', async () =>
    temporary(async (dir) => {
      await fs.writeFile(path.join(dir, 'README.md'), 'keep my work');
      await expect(generateProject(dir, backendConfig('axum'))).rejects.toThrow('empty directory');
      expect(await fs.readFile(path.join(dir, 'README.md'), 'utf8')).toBe('keep my work');
      expect(await fs.readdir(dir)).toEqual(['README.md']);
    }));
  it.each(['anchor', 'soroban-sdk', 'near-sdk', 'stylus-sdk'] as const)(
    'rejects unsupported %s rather than generating health DTOs or empty defaults',
    async (framework) =>
      temporary(async (dir) => {
        const config = backendConfig('axum');
        config.stack.frameworks = [framework];
        config.workspace = {
          apps: [],
          packages: [{ name: 'contracts', language: 'rust', framework, kind: 'contracts' }],
        };
        expect(() => defaultWorkspaces(['rust'], [framework], 'yarn')).toThrow('not implemented');
        await expect(generateProject(dir, config)).rejects.toThrow('not implemented');
        expect(await fs.readdir(dir)).toEqual([]);
      }),
  );
  it.each(['tauri', 'react-native', 'lynx'] as const)(
    'rejects unsupported %s app generation before writing',
    async (framework) =>
      temporary(async (dir) => {
        const config = backendConfig('axum');
        config.workspace = {
          apps: [{ name: 'app', language: 'typescript', framework }],
          packages: [],
        };
        await expect(generateProject(dir, config)).rejects.toThrow('not implemented');
        expect(await fs.readdir(dir)).toEqual([]);
      }),
  );
  it.each(['123-core', 'type', 'for'])('rejects invalid Go identifier %s', async (name) =>
    temporary(async (dir) => {
      const config = backendConfig('chi');
      config.workspace = {
        apps: [],
        packages: [{ name, language: 'golang', framework: 'chi', kind: 'library' }],
      };
      await expect(generateProject(dir, config)).rejects.toThrow('Invalid Go');
      expect(await fs.readdir(dir)).toEqual([]);
    }),
  );
  it('rejects unimplemented single-package mode rather than silently creating Nx', async () =>
    temporary(async (dir) => {
      const config = backendConfig('axum');
      config.stack.monorepo = false;
      await expect(generateProject(dir, config)).rejects.toThrow('Single-package');
      expect(await fs.readdir(dir)).toEqual([]);
    }));
  it('aligns interactive Rust contract defaults with headless defaults', () => {
    expect(
      reconcileWorkspaces(
        [{ name: 'contracts', language: 'typescript', framework: 'vitest', kind: 'contracts' }],
        ['typescript', 'rust'],
        ['axum', 'nextjs', 'vitest'],
        'yarn',
      ),
    ).toEqual(
      defaultWorkspaces(['typescript', 'rust'], ['axum', 'nextjs', 'vitest'], 'yarn').packages,
    );
  });
  it('generates Next targets, proxy, page, validation and coverage without the audited failures', async () =>
    temporary(async (dir) => {
      const config = backendConfig('axum');
      config.workspace.apps[1] = {
        name: 'web',
        language: 'typescript',
        framework: 'nextjs',
        kind: 'web',
      };
      config.stack.frameworks = ['axum', 'nextjs'];
      config.testing = { coverage: { enabled: true, threshold: 70 } };
      config.project.description = "An app's description";
      await generateProject(dir, config);
      const project = JSON.parse(
        await fs.readFile(path.join(dir, 'apps/web/project.json'), 'utf8'),
      );
      for (const target of ['build', 'test', 'typecheck'])
        expect(project.targets[target].options.cwd).toBe('apps/web');
      expect(await fs.readFile(path.join(dir, 'apps/web/src/app/page.tsx'), 'utf8')).not.toContain(
        'export const APP_CONFIG_SUMMARY',
      );
      expect(await fs.readFile(path.join(dir, 'apps/web/next.config.ts'), 'utf8')).toContain(
        'rewrites',
      );
      expect(await fs.readFile(path.join(dir, 'apps/web/src/app.tsx'), 'utf8')).toContain(
        'WEB_APP_INFO.healthEndpoint',
      );
      expect(await fs.readFile(path.join(dir, 'vitest.config.ts'), 'utf8')).toContain('lines: 70');
      expect(await fs.readFile(path.join(dir, '.prettierignore'), 'utf8')).toContain('target');
      expect(
        await fs.readFile(path.join(dir, '.github/workflows/pr-validation.yml'), 'utf8'),
      ).toContain('node scripts/validate.mjs');
      expect(await fs.readFile(path.join(dir, 'scripts/pipeline.sh'), 'utf8')).not.toContain(
        'npx little-bootstrapper',
      );
      const rust = await fs.readFile(path.join(dir, 'packages/contracts/src/lib.rs'), 'utf8');
      expect(rust).toContain('deserialize_with');
      expect(rust).toContain('value.is_finite()');
    }));
  it('links native modules into Rust and gives them executable regression tests', async () =>
    temporary(async (dir) => {
      const config = backendConfig('axum');
      await generateProject(dir, config);
      const files = await generateModule(dir, 'health', config, 'rust', 'api');
      expect(files).toContain('apps/api/src/domain/health.rs');
      expect(await fs.readFile(path.join(dir, 'apps/api/src/domain/mod.rs'), 'utf8')).toContain(
        'pub mod health;',
      );
      expect(await fs.readFile(path.join(dir, 'apps/api/src/main.rs'), 'utf8')).toContain(
        'pub mod domain;',
      );
      expect(await fs.readFile(path.join(dir, 'apps/api/src/domain/health.rs'), 'utf8')).toContain(
        'assert_eq!',
      );
      expect(await fs.readFile(path.join(dir, 'apps/api/src/adapters/http.rs'), 'utf8')).toContain(
        'axum::serve',
      );
    }));
  it('creates a runnable Ink entry and standard start/dev scripts', async () =>
    temporary(async (dir) => {
      const config = backendConfig('axum');
      config.stack.languages = ['typescript'];
      config.stack.frameworks = ['ink'];
      config.workspace = {
        apps: [{ name: 'cli', language: 'typescript', framework: 'ink', kind: 'cli' }],
        packages: [],
      };
      await generateProject(dir, config);
      const pkg = JSON.parse(await fs.readFile(path.join(dir, 'apps/cli/package.json'), 'utf8'));
      expect(pkg.scripts.start).toBe('node dist/main.js');
      expect(pkg.scripts.dev).toContain('tsx');
      expect(await fs.readFile(path.join(dir, 'apps/cli/src/main.tsx'), 'utf8')).toContain(
        'render',
      );
    }));
});
