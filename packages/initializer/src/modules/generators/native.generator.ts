import fs from 'node:fs/promises';
import path from 'node:path';
import type { BootstrapConfig, WorkspaceEntry } from '../../types/index.js';
import { getPinnedVersion } from '../catalog/index.js';

export function hasNativeWorkspaces(config: BootstrapConfig): boolean {
  return [...config.workspace.apps, ...config.workspace.packages].some(
    (e) => e.language !== 'typescript',
  );
}

export function nativeTargets(
  directory: string,
  entry: WorkspaceEntry,
  runnable: boolean,
): Record<string, unknown> {
  const command = (cmd: string) => ({
    executor: 'nx:run-commands',
    options: { command: cmd, cwd: directory },
  });
  if (entry.language === 'golang') {
    return {
      setup: command('go mod tidy'),
      build: runnable
        ? {
            executor: '@nx-go/nx-go:build',
            dependsOn: ['setup'],
            options: { main: `./${directory}`, outputPath: `dist/${directory}/app` },
          }
        : command('go build ./...'),
      test: { executor: '@nx-go/nx-go:test', dependsOn: ['setup'], options: {} },
      typecheck: { ...command('go vet ./...'), dependsOn: ['setup'] },
      ...(runnable
        ? {
            start: {
              executor: '@nx-go/nx-go:serve',
              dependsOn: ['setup'],
              options: { main: '.', cwd: directory },
            },
            dev: {
              executor: '@nx-go/nx-go:serve',
              dependsOn: ['setup'],
              options: { main: '.', cwd: directory },
            },
          }
        : {}),
    };
  }
  if (entry.language === 'rust') {
    return Object.fromEntries(
      ['build', 'test', 'typecheck', ...(runnable ? ['start', 'dev'] : [])].map((target) => [
        target,
        {
          executor: `@monodon/rust:${target === 'typecheck' ? 'check' : target === 'start' || target === 'dev' ? 'run' : target}`,
          options: {},
        },
      ]),
    );
  }
  const hardhat = entry.framework === 'hardhat';
  return {
    build: command(hardhat ? 'npx --no-install hardhat compile' : 'forge build'),
    test: command(hardhat ? 'npx --no-install hardhat test' : 'forge test'),
    typecheck: command(hardhat ? 'npx --no-install hardhat compile' : 'forge build'),
    start: command(hardhat ? 'npx --no-install hardhat node' : 'anvil'),
    dev: command(hardhat ? 'npx --no-install hardhat node' : 'forge test --watch'),
  };
}

export function nativePlugins(config: BootstrapConfig): string[] {
  const entries = [...config.workspace.apps, ...config.workspace.packages];
  return [
    ...(entries.some((e) => e.language === 'golang') ? ['@nx-go/nx-go'] : []),
    ...(entries.some((e) => e.language === 'rust') ? ['@monodon/rust'] : []),
  ];
}

export async function scaffoldNativeTooling(
  targetDir: string,
  config: BootstrapConfig,
): Promise<string[]> {
  const created: string[] = [];
  const entries = [
    ...config.workspace.apps.map((entry) => ({ entry, directory: `apps/${entry.name}` })),
    ...config.workspace.packages.map((entry) => ({ entry, directory: `packages/${entry.name}` })),
  ];
  const go = entries.filter(({ entry }) => entry.language === 'golang');
  if (go.length) {
    await fs.writeFile(
      path.join(targetDir, 'go.work'),
      `go 1.23.0\n\nuse (\n${go.map(({ directory }) => `\t./${directory}`).join('\n')}\n)\n`,
    );
    created.push('go.work');
  }
  const rust = entries.filter(({ entry }) => entry.language === 'rust');
  if (rust.length) {
    await fs.writeFile(
      path.join(targetDir, 'Cargo.toml'),
      `[workspace]\nresolver = "2"\nmembers = [${rust.map(({ directory }) => JSON.stringify(directory)).join(', ')}]\n`,
    );
    created.push('Cargo.toml');
  }
  for (const { entry, directory } of entries.filter(({ entry }) => entry.language === 'solidity')) {
    const dir = path.join(targetDir, directory);
    if (entry.framework === 'hardhat') {
      await fs.writeFile(
        path.join(dir, 'package.json'),
        `${JSON.stringify({ name: `@${config.project.name}/${entry.name}`, private: true, devDependencies: { hardhat: getPinnedVersion('hardhat') } }, null, 2)}\n`,
      );
      await fs.writeFile(
        path.join(dir, 'hardhat.config.cjs'),
        "module.exports = { solidity: '0.8.28', paths: { sources: './src', tests: './test' } };\n",
      );
      await fs.writeFile(
        path.join(dir, 'test/health.cjs'),
        `const assert = require('node:assert/strict');
const { artifacts, network } = require('hardhat');
describe('SampleContract', () => {
  it('deploys and reports a healthy service', async () => {
    const artifact = await artifacts.readArtifact('SampleContract');
    const [from] = await network.provider.send('eth_accounts');
    const hash = await network.provider.send('eth_sendTransaction', [{ from, data: artifact.bytecode }]);
    const receipt = await network.provider.send('eth_getTransactionReceipt', [hash]);
    const selector = await network.provider.send('web3_sha3', [\`0x\${Buffer.from('isHealthy()').toString('hex')}\`]);
    const result = await network.provider.send('eth_call', [{ to: receipt.contractAddress, data: selector.slice(0, 10) }, 'latest']);
    assert.equal(BigInt(result), 1n);
  });
});\n`,
      );
      created.push(
        `${directory}/package.json`,
        `${directory}/hardhat.config.cjs`,
        `${directory}/test/health.cjs`,
      );
    } else {
      await fs.writeFile(
        path.join(dir, 'foundry.toml'),
        '[profile.default]\nsrc = "src"\ntest = "test"\nsolc_version = "0.8.28"\n',
      );
      await fs.writeFile(
        path.join(dir, 'test/SampleContract.t.sol'),
        '// SPDX-License-Identifier: MIT\npragma solidity 0.8.28;\nimport {SampleContract} from "../src/SampleContract.sol";\ncontract SampleContractTest {\n    function testHealth() public {\n        require(new SampleContract().isHealthy(), "unhealthy");\n    }\n}\n',
      );
      created.push(`${directory}/foundry.toml`, `${directory}/test/SampleContract.t.sol`);
    }
  }
  return created;
}
