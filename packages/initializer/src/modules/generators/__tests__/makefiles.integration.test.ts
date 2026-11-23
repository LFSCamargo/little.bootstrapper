import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { BootstrapConfig } from '../../../types/index.js';
import { generateProject } from '../index.js';

const run = promisify(execFile);
function config(): BootstrapConfig {
  return {
    version: '1.0.0',
    project: {
      name: 'native-demo',
      author: 'dev',
      description: 'Native commands',
      codeowners: false,
    },
    stack: {
      languages: ['typescript'],
      frameworks: [],
      packageManager: 'yarn',
      monorepo: true,
      useMakefiles: false,
      tools: [],
      agents: [],
    },
    workspace: {
      apps: [
        { name: 'api', language: 'golang', framework: 'chi' },
        { name: 'worker', language: 'rust', framework: 'axum' },
        { name: 'chain', language: 'solidity', framework: 'foundry' },
      ],
      packages: [
        { name: 'core', language: 'golang', framework: 'chi' },
        { name: 'math', language: 'rust', framework: 'axum' },
        { name: 'contracts', language: 'solidity', framework: 'hardhat' },
        { name: 'shared', language: 'typescript', framework: 'vitest' },
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
      exampleModule: false,
    },
  };
}

describe('native workspace Makefiles (integration)', () => {
  it('executes the default tests and all standard targets from the correct package through root make', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'native commands '));
    try {
      const result = await generateProject(dir, config());
      const realDir = await fs.realpath(dir);
      const directories = [
        'apps/api',
        'apps/worker',
        'apps/chain',
        'packages/core',
        'packages/math',
        'packages/contracts',
      ];
      const bin = path.join(dir, 'fake-tools');
      const log = path.join(dir, 'calls');
      await fs.mkdir(bin);
      for (const tool of ['go', 'cargo', 'forge', 'anvil', 'npx']) {
        await fs.writeFile(
          path.join(bin, tool),
          `#!/bin/sh\nprintf '%s|%s|%s\\n' "$PWD" "${tool}" "$*" >> "$CALL_LOG"\n[ "$FAIL_TOOL" != "${tool}" ]\n`,
          { mode: 0o755 },
        );
      }
      const env = {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        CALL_LOG: log,
      };
      for (const directory of directories) {
        expect(result.filesCreated).toContain(`${directory}/Makefile`);
        const makefile = await fs.readFile(path.join(dir, directory, 'Makefile'), 'utf-8');
        expect(makefile).toContain('.DEFAULT_GOAL := test');
        for (const target of ['build', 'start', 'dev', 'test']) {
          expect(makefile).toMatch(new RegExp(`^${target}:`, 'm'));
        }
        const project = await fs.readFile(path.join(dir, directory, 'project.json'), 'utf-8');
        expect(project).toContain(`"cwd": "${directory}"`);
        expect(project).not.toContain('echo');
      }
      await expect(fs.access(path.join(dir, 'packages/shared/Makefile'))).rejects.toThrow();
      expect(await fs.readFile(path.join(dir, 'apps/chain/Makefile'), 'utf-8')).toContain(
        'forge test --watch',
      );
      expect(
        await fs.readFile(path.join(dir, 'packages/contracts/hardhat.config.cjs'), 'utf-8'),
      ).toContain("sources: './src'");
      expect(await fs.readFile(path.join(dir, 'bootstrap.config.json'), 'utf-8')).toContain(
        '"useMakefiles": true',
      );
      await run('make', ['--no-print-directory'], { cwd: dir, env });
      const calls = (await fs.readFile(log, 'utf-8')).trim().split('\n');
      expect(calls).toHaveLength(6);
      expect(calls.map((line) => line.slice(realDir.length + 1)).sort()).toEqual(
        [
          'apps/api|go|test ./...',
          'apps/chain|forge|test',
          'apps/worker|cargo|test',
          'packages/contracts|npx|--no-install hardhat test',
          'packages/core|go|test ./...',
          'packages/math|cargo|test',
        ].sort(),
      );
      await run('make', ['build', 'dev'], { cwd: dir, env });
      await run('make', ['test-packages-core'], { cwd: dir, env });
      await expect(
        run('make', ['test-apps-worker'], { cwd: dir, env: { ...env, FAIL_TOOL: 'cargo' } }),
      ).rejects.toThrow();
      await expect(run('make', ['start-packages-math'], { cwd: dir, env })).rejects.toThrow();
      const start = await run('make', ['-n', 'start'], { cwd: dir, env });
      expect(start.stdout).toContain('./bin/app');
      expect(start.stdout).toContain('cargo run');
      expect(start.stdout).toContain('anvil');
      expect(start.stdout).not.toContain('start-packages-math');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('does not add native commands to TypeScript-only projects', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'native-ts-'));
    try {
      const cfg = config();
      cfg.workspace = {
        apps: [],
        packages: [{ name: 'shared', language: 'typescript', framework: 'vitest' }],
      };
      const result = await generateProject(dir, cfg);
      expect(result.filesCreated).not.toContain('Makefile');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
