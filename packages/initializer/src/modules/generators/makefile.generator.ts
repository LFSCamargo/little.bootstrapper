import fs from 'node:fs/promises';
import path from 'node:path';
import type { BootstrapConfig, WorkspaceEntry } from '../../types/index.js';
import { getPinnedVersion } from '../catalog/index.js';

const TARGETS = ['build', 'start', 'dev', 'test'] as const;
type Target = (typeof TARGETS)[number];
type Commands = Record<Target, string>;

export function nativeTargets(directory: string): Record<string, unknown> {
  return Object.fromEntries(
    TARGETS.map((target) => [
      target,
      {
        executor: 'nx:run-commands',
        options: { command: `make ${target}`, cwd: directory },
      },
    ]),
  );
}

export function hasNativeWorkspaces(config: BootstrapConfig): boolean {
  return [
    ...config.stack.languages,
    ...config.workspace.apps.map((entry) => entry.language),
    ...config.workspace.packages.map((entry) => entry.language),
  ].some((language) => language !== 'typescript');
}

function commandsFor(entry: WorkspaceEntry, runnable: boolean): Commands {
  const libraryStart =
    '@echo "This workspace is a library, not an executable. Use make build or make test." >&2; exit 2';
  switch (entry.language) {
    case 'golang':
      return {
        build: runnable ? 'go build -o bin/app .' : 'go build ./...',
        start: runnable ? './bin/app' : libraryStart,
        dev: runnable ? 'go run .' : 'go test ./...',
        test: 'go test ./...',
      };
    case 'rust':
      return {
        build: 'cargo build',
        start: runnable ? 'cargo run' : libraryStart,
        dev: runnable ? 'cargo run' : 'cargo test',
        test: 'cargo test',
      };
    case 'solidity':
      return entry.framework === 'hardhat'
        ? {
            build: 'npx --no-install hardhat compile',
            start: 'npx --no-install hardhat node',
            dev: 'npx --no-install hardhat node',
            test: 'npx --no-install hardhat test',
          }
        : { build: 'forge build', start: 'anvil', dev: 'forge test --watch', test: 'forge test' };
    default:
      throw new Error(`Cannot generate a native Makefile for ${entry.language}`);
  }
}

export async function scaffoldNativeMakefiles(
  targetDir: string,
  config: BootstrapConfig,
): Promise<string[]> {
  if (!hasNativeWorkspaces(config)) return [];
  const created: string[] = [];
  const entries = [
    ...config.workspace.apps.map((entry) => ({ entry, directory: `apps/${entry.name}` })),
    ...config.workspace.packages.map((entry) => ({ entry, directory: `packages/${entry.name}` })),
  ].filter(({ entry }) => entry.language !== 'typescript');
  const root = [
    '# Native workspace commands. Bare make runs tests.',
    '.DEFAULT_GOAL := test',
    '.PHONY: build start dev test',
    '',
  ];
  const runnableDirectories = new Set<string>();
  for (const { entry, directory } of entries) {
    // Names become Make targets and recipe paths; reject Make/shell metacharacters.
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name))
      throw new Error(`Invalid workspace name: ${entry.name}`);
    const dir = path.join(targetDir, directory);
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const sourceFiles = await fs.readdir(path.join(dir, 'src')).catch((): string[] => []);
    const runnable =
      files.includes('main.go') || sourceFiles.includes('main.rs') || entry.language === 'solidity';
    if (runnable) runnableDirectories.add(directory);
    const commands = commandsFor(entry, runnable);
    const local = ['.DEFAULT_GOAL := test', '.PHONY: build start dev test', ''];
    for (const target of TARGETS) {
      local.push(
        `${target}:${target === 'start' && runnable && entry.language === 'golang' ? ' build' : ''}`,
        `\t${commands[target]}`,
        '',
      );
      const alias = `${target}-${directory.replace('/', '-')}`;
      root.push(`.PHONY: ${alias}`, `${alias}:`, `\t$(MAKE) -C "${directory}" ${target}`, '');
    }
    await fs.writeFile(path.join(dir, 'Makefile'), local.join('\n'), 'utf-8');
    await fs.appendFile(
      path.join(dir, 'README.md'),
      '\n## Commands\n\n`make` / `make test` runs tests; `make build` builds; `make dev` runs locally.\n`make start` runs the executable or local contract node (libraries report that no executable exists).\nRun the same targets from the root using `<target>-' +
        directory.replace('/', '-') +
        '`.\n',
    );
    created.push(`${directory}/Makefile`);
    if (entry.language === 'solidity') {
      if (entry.framework === 'hardhat') {
        await fs.writeFile(
          path.join(dir, 'package.json'),
          `${JSON.stringify(
            {
              name: `@${config.project.name}/${entry.name}`,
              private: true,
              devDependencies: { hardhat: getPinnedVersion('hardhat') },
            },
            null,
            2,
          )}\n`,
        );
        await fs.writeFile(
          path.join(dir, 'hardhat.config.cjs'),
          "module.exports = { solidity: '0.8.28', paths: { sources: './src', tests: './test' } };\n",
        );
        created.push(`${directory}/package.json`, `${directory}/hardhat.config.cjs`);
      } else {
        await fs.writeFile(
          path.join(dir, 'foundry.toml'),
          '[profile.default]\nsrc = "src"\ntest = "test"\nsolc_version = "0.8.28"\n',
        );
        created.push(`${directory}/foundry.toml`);
      }
    }
  }
  for (const target of TARGETS) {
    const selected = entries.filter(
      ({ directory }) => target !== 'start' || runnableDirectories.has(directory),
    );
    const aliases = selected.map(({ directory }) => `${target}-${directory.replace('/', '-')}`);
    // Development servers and contract nodes must be able to run together.
    root.push(`${target}:${target === 'start' || target === 'dev' ? '' : ' ' + aliases.join(' ')}`);
    if ((target === 'start' || target === 'dev') && aliases.length)
      root.push(`\t$(MAKE) -j${aliases.length} ${aliases.join(' ')}`);
    if (!aliases.length) root.push(`\t@echo "No native workspaces available for ${target}."`);
    root.push('');
  }
  await fs.writeFile(path.join(targetDir, 'Makefile'), root.join('\n'), 'utf-8');
  return [...created, 'Makefile'];
}
