import { it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject } from '../../src/modules/generators/index.js';
import { backendConfig } from '../../src/modules/generators/__tests__/fixtures/backend-config.js';

const run = promisify(execFile);
for (const pm of ['yarn', 'npm', 'pnpm', 'bun'] as const) {
  it.runIf(process.env.PACKAGE_MANAGER_TESTS === '1')(
    `installs, builds, checks and tests a fresh ${pm} workspace`,
    async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), `setup-${pm}-`));
      try {
        const config = backendConfig('axum');
        config.stack.languages = ['typescript'];
        config.stack.frameworks = [pm === 'bun' ? 'elysia' : 'hono', 'ink'];
        config.stack.packageManager = pm;
        config.stack.linter = (
          { yarn: 'eslint', npm: 'biome', pnpm: 'oxlint', bun: 'none' } as const
        )[pm];
        config.stack.agents = ['codex'];
        config.workspace = {
          apps: [
            {
              name: 'api',
              language: 'typescript',
              framework: pm === 'bun' ? 'elysia' : 'hono',
              kind: 'backend',
            },
            { name: 'cli', language: 'typescript', framework: 'ink', kind: 'cli' },
          ],
          packages: [
            { name: 'contracts', language: 'typescript', framework: 'vitest', kind: 'contracts' },
          ],
        };
        config.architecture.exampleModule = true;
        const result = await generateProject(dir, config);
        const env = { ...process.env, NX_DAEMON: 'false', NX_ISOLATE_PLUGINS: 'false' };
        const options = { cwd: dir, env, timeout: 240000, maxBuffer: 16 * 1024 * 1024 };
        await run(pm, pm === 'yarn' ? ['install'] : ['install', '--ignore-scripts'], options);
        for (const command of ['typecheck', 'build', 'test', 'lint', 'format:check']) {
          try {
            await run(pm, ['run', command], options);
          } catch (error) {
            throw new Error(
              `${pm} ${command} failed: ${String(error) + '\n' + (error as { stdout?: string }).stdout}`,
            );
          }
        }
        expect(result.filesCreated).toContain('apps/api/vitest.config.ts');
        await run('node', ['scripts/validate.mjs'], options);
        const cli = await run(
          pm,
          [pm === 'bun' ? 'run' : 'exec', 'nx', 'run', '@chatify.stack/cli:start'],
          options,
        );
        expect(cli.stdout).toContain('ready');
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
    },
    600000,
  );
}
