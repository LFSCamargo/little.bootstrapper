import { beforeAll, it, expect } from 'vitest';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { freePort } from './helpers/port.js';

const root = process.env.INITIALIZATION_MATRIX_ROOT;
const run = promisify(execFile);
beforeAll(async () => {
  if (!root) return;
  for (const framework of ['hono', 'express', 'koa', 'fastify']) {
    await run('npm', ['run', 'build'], {
      cwd: path.join(root, 'apps', framework),
      timeout: 120000,
    });
  }
}, 480000);

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (child.pid) process.kill(-child.pid, 'SIGTERM');
  await new Promise<void>((resolve) => child.once('exit', () => resolve()));
}
async function waitFor(child: ChildProcess, url: string) {
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  await expect
    .poll(
      async () => {
        if (child.exitCode !== null) throw new Error(output);
        try {
          return (await fetch(url)).status;
        } catch {
          return 0;
        }
      },
      { timeout: 30000 },
    )
    .toBe(200);
}

for (const framework of ['hono', 'express', 'koa', 'fastify']) {
  for (const command of ['start', 'dev']) {
    it.runIf(Boolean(root))(
      `serves ${framework} using generated ${command}`,
      async () => {
        if (!root) throw new Error('Missing matrix root');
        const port = await freePort();
        const child = spawn('npm', ['run', command], {
          cwd: path.join(root, 'apps', framework),
          env: { ...process.env, PORT: String(port) },
          detached: true,
          stdio: 'pipe',
        });
        try {
          await waitFor(child, `http://127.0.0.1:${port}/health`);
          const body = (await (await fetch(`http://127.0.0.1:${port}/health`)).json()) as {
            status: string;
          };
          expect(body.status).toBe('ok');
          expect((await fetch(`http://127.0.0.1:${port}/missing`)).status).toBe(404);
        } finally {
          await stop(child);
        }
      },
      60000,
    );
  }
}

for (const framework of ['next', 'vite', 'nuxt']) {
  it.runIf(Boolean(root))(
    `builds and opens generated ${framework} with the live health proxy`,
    async () => {
      if (!root) throw new Error('Missing matrix root');
      const apiPort = await freePort();
      const webPort = await freePort();
      const env = {
        ...process.env,
        API_URL: `http://127.0.0.1:${apiPort}`,
        PORT: String(webPort),
        HOST: '127.0.0.1',
      };
      const cwd = path.join(root, 'apps', `web-${framework}`);
      await run('npm', ['run', 'build'], { cwd, env, timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
      const api = spawn('npm', ['run', 'start'], {
        cwd: path.join(root, 'apps/hono'),
        env: { ...env, PORT: String(apiPort) },
        detached: true,
        stdio: 'pipe',
      });
      const web = spawn(
        'npm',
        [
          'run',
          'start',
          '--',
          ...(framework === 'nuxt'
            ? ['--port', String(webPort)]
            : [
                '--port',
                String(webPort),
                ...(framework === 'vite' ? ['--host', '127.0.0.1'] : []),
              ]),
        ],
        { cwd, env, detached: true, stdio: 'pipe' },
      );
      try {
        await waitFor(api, `http://127.0.0.1:${apiPort}/health`);
        await waitFor(web, `http://127.0.0.1:${webPort}`);
        const browser = await chromium.launch();
        try {
          const page = await browser.newPage();
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(`http://127.0.0.1:${webPort}`);
          await page.getByRole('button', { name: 'Check API health' }).click();
          await expect
            .poll(() => page.getByRole('status').textContent())
            .toBe('setup-matrix-hono: ok');
          expect(errors).toEqual([]);
        } finally {
          await browser.close();
        }
      } finally {
        await stop(web);
        await stop(api);
      }
    },
    240000,
  );
}
