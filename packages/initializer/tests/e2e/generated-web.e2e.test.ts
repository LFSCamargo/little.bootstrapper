import { it, expect } from 'vitest';
import { chromium } from '@playwright/test';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import { freePort } from './helpers/port.js';
import path from 'node:path';

it.runIf(Boolean(process.env.GENERATED_WEB_ROOT))(
  'opens the generated web app and validates the live Rust health response',
  async () => {
    const root = process.env.GENERATED_WEB_ROOT;
    if (!root) throw new Error('GENERATED_WEB_ROOT is required');
    const config = JSON.parse(await fs.readFile(path.join(root, 'bootstrap.config.json'), 'utf8'));
    const isNext = config.workspace.apps.some(
      (app: { framework: string }) => app.framework === 'nextjs',
    );
    const apiPort = await freePort();
    const webPort = await freePort();
    const webEnv = { ...process.env, API_URL: `http://127.0.0.1:${apiPort}` };
    if (isNext) {
      await promisify(execFile)(
        process.execPath,
        [path.join(root, 'node_modules/next/dist/bin/next'), 'build'],
        {
          cwd: path.join(root, 'apps/web'),
          env: webEnv,
          timeout: 180000,
          maxBuffer: 8 * 1024 * 1024,
        },
      );
    }
    const api = spawn(path.join(root, 'target/debug/chatify-stack-api'), [], {
      cwd: root,
      env: { ...process.env, PORT: String(apiPort) },
      stdio: 'pipe',
    });
    const web = spawn(
      process.execPath,
      isNext
        ? [
            path.join(root, 'node_modules/next/dist/bin/next'),
            'start',
            '--hostname',
            '127.0.0.1',
            '--port',
            String(webPort),
          ]
        : [
            path.join(root, 'node_modules/vite/bin/vite.js'),
            '--host',
            '127.0.0.1',
            '--port',
            String(webPort),
            '--strictPort',
          ],
      {
        cwd: path.join(root, 'apps/web'),
        env: webEnv,
        stdio: 'pipe',
      },
    );
    let errors = '';
    api.stderr.on('data', (chunk: Buffer) => {
      errors += chunk.toString();
    });
    web.stderr.on('data', (chunk: Buffer) => {
      errors += chunk.toString();
    });
    try {
      await expect
        .poll(
          async () => {
            if (api.exitCode !== null || web.exitCode !== null) throw new Error(errors);
            try {
              return (
                (await fetch(`http://127.0.0.1:${apiPort}/health`)).status +
                (await fetch(`http://127.0.0.1:${webPort}`)).status
              );
            } catch {
              return 0;
            }
          },
          { timeout: 15000 },
        )
        .toBe(400);
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();
        const pageErrors: string[] = [];
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await page.goto(`http://127.0.0.1:${webPort}`);
        await expect
          .poll(() => page.getByRole('heading', { name: 'chatify.stack' }).count())
          .toBe(1);
        await page.getByRole('button', { name: 'Check API health' }).click();
        await expect
          .poll(() => page.getByRole('status').textContent())
          .toBe('chatify.stack-api: ok');
        expect(pageErrors).toEqual([]);
      } finally {
        await browser.close();
      }
    } finally {
      for (const child of [web, api]) {
        child.kill('SIGTERM');
        await new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) resolve();
          else child.once('exit', () => resolve());
        });
      }
    }
  },
  240000,
);
