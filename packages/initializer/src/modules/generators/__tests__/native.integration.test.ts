import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { BootstrapConfig } from '../../../types/index.js';
import { generateProject } from '../index.js';

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

describe('native workspace Nx plugins (integration)', () => {
  it('scaffolds Nx-native targets and tooling for Go, Rust, and Solidity workspaces', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'native-nx-'));
    try {
      const result = await generateProject(dir, config());

      // Root workspace tooling
      expect(result.filesCreated).toContain('nx.json');
      expect(result.filesCreated).toContain('go.work');
      expect(result.filesCreated).toContain('Cargo.toml');
      expect(result.filesCreated).not.toContain('Makefile');

      const nxJson = JSON.parse(await fs.readFile(path.join(dir, 'nx.json'), 'utf-8')) as {
        plugins: string[];
      };
      expect(nxJson.plugins).toEqual(expect.arrayContaining(['@nx-go/nx-go', '@monodon/rust']));

      const rootPkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf-8')) as {
        devDependencies: Record<string, string>;
      };
      expect(rootPkg.devDependencies['@nx-go/nx-go']).toBe('3.3.1');
      expect(rootPkg.devDependencies['@monodon/rust']).toBe('2.3.0');

      const goWork = await fs.readFile(path.join(dir, 'go.work'), 'utf-8');
      expect(goWork).toContain('./apps/api');
      expect(goWork).toContain('./packages/core');

      const cargoWorkspace = await fs.readFile(path.join(dir, 'Cargo.toml'), 'utf-8');
      expect(cargoWorkspace).toContain('"apps/worker"');
      expect(cargoWorkspace).toContain('"packages/math"');

      // Go application uses @nx-go/nx-go executors for runnable targets
      const goAppProject = JSON.parse(
        await fs.readFile(path.join(dir, 'apps/api/project.json'), 'utf-8'),
      ) as { targets: Record<string, { executor: string; options?: Record<string, unknown> }> };
      expect(goAppProject.targets.build.executor).toBe('@nx-go/nx-go:build');
      expect(goAppProject.targets.test.executor).toBe('@nx-go/nx-go:test');
      expect(goAppProject.targets.start.executor).toBe('@nx-go/nx-go:serve');
      expect(goAppProject.targets.dev.executor).toBe('@nx-go/nx-go:serve');
      expect(goAppProject.targets.setup.options?.command).toBe('go mod tidy');
      expect(goAppProject.targets.typecheck.options?.command).toBe('go vet ./...');

      // Go library uses nx:run-commands for build/test/typecheck
      const goLibProject = JSON.parse(
        await fs.readFile(path.join(dir, 'packages/core/project.json'), 'utf-8'),
      ) as { targets: Record<string, { executor: string; options?: Record<string, unknown> }> };
      expect(goLibProject.targets.build.executor).toBe('nx:run-commands');
      expect(goLibProject.targets.build.options?.command).toBe('go build ./...');
      expect(goLibProject.targets.test.executor).toBe('@nx-go/nx-go:test');
      expect(goLibProject.targets.setup.options?.command).toBe('go mod tidy');

      // Rust application uses @monodon/rust executors
      const rustAppProject = JSON.parse(
        await fs.readFile(path.join(dir, 'apps/worker/project.json'), 'utf-8'),
      ) as { targets: Record<string, { executor: string }> };
      expect(rustAppProject.targets.build.executor).toBe('@monodon/rust:build');
      expect(rustAppProject.targets.test.executor).toBe('@monodon/rust:test');
      expect(rustAppProject.targets.typecheck.executor).toBe('@monodon/rust:check');
      expect(rustAppProject.targets.start.executor).toBe('@monodon/rust:run');
      expect(rustAppProject.targets.dev.executor).toBe('@monodon/rust:run');

      // Rust library exposes non-runnable targets only
      const rustLibProject = JSON.parse(
        await fs.readFile(path.join(dir, 'packages/math/project.json'), 'utf-8'),
      ) as { targets: Record<string, { executor: string }> };
      expect(rustLibProject.targets.build.executor).toBe('@monodon/rust:build');
      expect(rustLibProject.targets.test.executor).toBe('@monodon/rust:test');
      expect(rustLibProject.targets.typecheck.executor).toBe('@monodon/rust:check');
      expect(rustLibProject.targets.start).toBeUndefined();
      expect(rustLibProject.targets.dev).toBeUndefined();

      // Solidity app (Foundry)
      const foundryProject = JSON.parse(
        await fs.readFile(path.join(dir, 'apps/chain/project.json'), 'utf-8'),
      ) as { targets: Record<string, { executor: string; options?: Record<string, unknown> }> };
      expect(foundryProject.targets.build.options?.command).toContain('forge build');
      expect(foundryProject.targets.test.options?.command).toContain('forge test');
      expect(foundryProject.targets.start.options?.command).toContain('anvil');
      expect(foundryProject.targets.dev.options?.command).toContain('forge test --watch');
      expect(result.filesCreated).toContain('apps/chain/foundry.toml');
      expect(result.filesCreated).toContain('apps/chain/test/SampleContract.t.sol');

      // Solidity package (Hardhat)
      const hardhatProject = JSON.parse(
        await fs.readFile(path.join(dir, 'packages/contracts/project.json'), 'utf-8'),
      ) as { targets: Record<string, { executor: string; options?: Record<string, unknown> }> };
      expect(hardhatProject.targets.build.options?.command).toContain('hardhat compile');
      expect(hardhatProject.targets.test.options?.command).toContain('hardhat test');
      expect(result.filesCreated).toContain('packages/contracts/hardhat.config.cjs');
      expect(result.filesCreated).toContain('packages/contracts/package.json');

      // TypeScript package is untouched by native tooling
      expect(result.filesCreated).toContain('packages/shared/package.json');
      expect(result.filesCreated).not.toContain('packages/shared/Makefile');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('does not add native plugins or tooling to TypeScript-only projects', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'native-ts-'));
    try {
      const cfg = config();
      cfg.workspace = {
        apps: [],
        packages: [{ name: 'shared', language: 'typescript', framework: 'vitest' }],
      };
      const result = await generateProject(dir, cfg);
      expect(result.filesCreated).not.toContain('go.work');
      expect(result.filesCreated).not.toContain('Cargo.toml');
      expect(result.filesCreated).not.toContain('Makefile');
      const nxJson = JSON.parse(await fs.readFile(path.join(dir, 'nx.json'), 'utf-8')) as {
        plugins: string[];
      };
      expect(nxJson.plugins).toHaveLength(0);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
