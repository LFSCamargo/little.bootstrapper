import { it, expect } from 'vitest';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { freePort } from './helpers/port.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { generateProject } from '../../src/modules/generators/index.js';
import { backendConfig } from '../../src/modules/generators/__tests__/fixtures/backend-config.js';

const run = promisify(execFile);
const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('chatify.stack-api'),
  version: z.string(),
  timestamp: z.string().datetime(),
  uptimeSeconds: z.number().nonnegative(),
});

for (const framework of ['axum', 'hyper', 'chi', 'gin', 'echo', 'fiber'] as const) {
  for (const pattern of [
    'standard',
    'layered',
    'modular',
    'hexagonal',
    'clean',
    'vertical-slice',
  ] as const) {
    it.runIf(process.env.NATIVE_TOOLCHAIN_TESTS === '1')(
      `compiles and serves /health and 404 with ${framework} and ${pattern}`,
      async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), `native-live-${framework}-`));
        try {
          const config = backendConfig(framework);
          config.architecture.exampleModule = true;
          config.architecture.pattern = pattern;
          await generateProject(dir, config);
          const api = path.join(dir, 'apps/api');
          const rust = framework === 'axum' || framework === 'hyper';
          const binary = rust
            ? path.join(dir, 'target/debug/chatify-stack-api')
            : path.join(dir, 'api');
          if (rust) {
            await run('cargo', ['test', '--workspace'], { cwd: dir, timeout: 240000 });
            await run('cargo', ['build', '--workspace'], { cwd: dir, timeout: 240000 });
          } else {
            await run('go', ['mod', 'tidy'], { cwd: api, timeout: 240000 });
            await run('go', ['test', './...'], { cwd: api, timeout: 240000 });
            await run('go', ['build', '-o', binary, '.'], { cwd: api, timeout: 240000 });
          }
          const port = await freePort();
          const server = spawn(binary, [], {
            cwd: api,
            env: { ...process.env, PORT: String(port) },
            stdio: 'pipe',
          });
          let log = '';
          server.stderr.on('data', (chunk: Buffer) => {
            log += chunk.toString();
          });
          try {
            await expect
              .poll(
                async () => {
                  if (server.exitCode !== null) throw new Error(`API exited: ${log}`);
                  try {
                    return (await fetch(`http://127.0.0.1:${port}/health`)).status;
                  } catch {
                    return 0;
                  }
                },
                { timeout: 10000 },
              )
              .toBe(200);
            const response = await fetch(`http://127.0.0.1:${port}/health`);
            expect(response.headers.get('content-type')).toContain('application/json');
            expect(healthSchema.safeParse(await response.json()).success).toBe(true);
            expect((await fetch(`http://127.0.0.1:${port}/missing`)).status).toBe(404);
          } finally {
            server.kill('SIGTERM');
            await new Promise<void>((resolve) => {
              if (server.exitCode !== null) resolve();
              else server.once('exit', () => resolve());
            });
          }
        } finally {
          await fs.rm(dir, { recursive: true, force: true });
        }
      },
      600000,
    );
  }
}
