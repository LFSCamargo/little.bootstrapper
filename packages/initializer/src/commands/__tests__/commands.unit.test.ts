import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseCliArgs, getFlagValue, hasFlag, dispatchCommand } from '../index.js';

describe('commands (unit)', () => {
  it('parses subcommand, flags, and --dir override cleanly', () => {
    const parsed = parseCliArgs(
      ['init', '--yes', '--name', 'planet-ship', '--dir', './tmp-dir'],
      '/workspace',
    );
    expect(parsed.command).toBe('init');
    expect(hasFlag(parsed.rawArgs, '--yes')).toBe(true);
    expect(hasFlag(parsed.rawArgs, '--no-monorepo')).toBe(false);
    expect(getFlagValue(parsed.rawArgs, '--name')).toBe('planet-ship');
    expect(parsed.cwd).toBe(path.resolve('./tmp-dir'));
  });

  it('routes interactive commands to isolated interactive modes without exiting', async () => {
    expect(await dispatchCommand([], '/tmp')).toEqual({
      kind: 'interactive',
      mode: 'menu',
      cwd: '/tmp',
    });
    expect(await dispatchCommand(['init'], '/tmp')).toEqual({
      kind: 'interactive',
      mode: 'init',
      cwd: '/tmp',
    });
    expect(await dispatchCommand(['rules'], '/tmp')).toEqual({
      kind: 'interactive',
      mode: 'rules',
      cwd: '/tmp',
    });
    expect(await dispatchCommand(['mcps'], '/tmp')).toEqual({
      kind: 'interactive',
      mode: 'mcps',
      cwd: '/tmp',
    });
    expect(await dispatchCommand(['normalize'], '/tmp')).toEqual({
      kind: 'interactive',
      mode: 'normalize',
      cwd: '/tmp',
    });
    expect(await dispatchCommand(['update'], '/tmp')).toEqual({
      kind: 'interactive',
      mode: 'update',
      cwd: '/tmp',
    });
  });

  it('executes non-interactive commands (help, version, rules, mcps, init, generate, normalize, update, validate)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-cmd-unit-'));

    try {
      expect(await dispatchCommand(['--help'], tmpDir)).toEqual({ kind: 'exit', exitCode: 0 });
      expect(await dispatchCommand(['--version'], tmpDir)).toEqual({ kind: 'exit', exitCode: 0 });
      expect(await dispatchCommand(['rules', '--list'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['rules', '--search', 'financial'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['rules', '--install', 'financial-rules'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['rules', '--install', 'bogus-rule'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 1,
      });

      expect(await dispatchCommand(['mcps', '--list'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['mcps', '--search', 'postgres'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['mcps', '--install', 'context7,nx'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['mcps', '--install', 'rogue-mcp'], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 1,
      });

      const projDir = path.join(tmpDir, 'ship-app');
      expect(
        await dispatchCommand(
          [
            'init',
            '--yes',
            '--name',
            'ship-app',
            '--coverage-threshold',
            '80',
            '--domains',
            'financial',
            '--out',
            projDir,
          ],
          tmpDir,
        ),
      ).toEqual({ kind: 'exit', exitCode: 0 });

      const initInvalid = await dispatchCommand(
        ['init', '--yes', '--name', 'bad name', '--coverage-threshold', '150'],
        tmpDir,
      );
      expect(initInvalid).toEqual({ kind: 'exit', exitCode: 1 });

      expect(await dispatchCommand(['mcps', '--recommend', '--dir', projDir], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['generate', 'warp-core', '--dir', projDir], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['generate'], tmpDir)).toEqual({ kind: 'exit', exitCode: 1 });

      expect(
        await dispatchCommand(
          ['normalize', '--apply', '--agent', 'claude', '--dir', projDir],
          tmpDir,
        ),
      ).toEqual({ kind: 'exit', exitCode: 0 });
      expect(
        await dispatchCommand(
          ['normalize', '--apply', '--agent', 'invalid', '--dir', projDir],
          tmpDir,
        ),
      ).toEqual({ kind: 'exit', exitCode: 1 });

      expect(await dispatchCommand(['update', '--apply', '--dir', projDir], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['validate', '--json', '--dir', projDir], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
      expect(await dispatchCommand(['validate', '--dir', projDir], tmpDir)).toEqual({
        kind: 'exit',
        exitCode: 0,
      });
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
