import fs from 'node:fs/promises';
import path from 'node:path';
import { format, getFileInfo } from 'prettier';
import type { BootstrapConfig } from '../../types/index.js';

export const UNSUPPORTED_TEMPLATES = new Set([
  'anchor',
  'soroban-sdk',
  'near-sdk',
  'stylus-sdk',
  'tauri',
  'react-native',
  'lynx',
]);

export function validateInitialization(config: BootstrapConfig): void {
  if (
    (config.stack.frameworks.includes('elysia') ||
      [...config.workspace.apps, ...config.workspace.packages].some(
        (entry) => entry.framework === 'elysia',
      )) &&
    config.stack.packageManager !== 'bun'
  )
    throw new Error('Elysia requires the Bun package manager and runtime.');
  if (config.stack.frameworks.includes('jest'))
    throw new Error(
      'Generated workspace tests use Vitest. Jest templates are not implemented; select vitest.',
    );
  if (!config.stack.monorepo)
    throw new Error('Single-package initialization is not implemented. Enable monorepo mode.');
  for (const entry of [...config.workspace.apps, ...config.workspace.packages]) {
    if (UNSUPPORTED_TEMPLATES.has(entry.framework))
      throw new Error(
        `Template ${entry.framework} is not implemented; no project files were written.`,
      );
    if (
      entry.language === 'golang' &&
      (!/^[a-z][a-z0-9_]*$/.test(entry.name.replace(/-/g, '_')) ||
        new Set([
          'break',
          'default',
          'func',
          'interface',
          'select',
          'case',
          'defer',
          'go',
          'map',
          'struct',
          'chan',
          'else',
          'goto',
          'package',
          'switch',
          'const',
          'fallthrough',
          'if',
          'range',
          'type',
          'continue',
          'for',
          'import',
          'return',
          'var',
        ]).has(entry.name))
    )
      throw new Error(`Invalid Go package identifier: ${entry.name}`);
    if (
      entry.language === 'rust' &&
      config.workspace.apps.includes(entry) &&
      entry.framework !== 'axum' &&
      entry.framework !== 'hyper'
    )
      throw new Error(
        `Rust application ${entry.name} requires a supported executable framework (axum or hyper).`,
      );
  }
  for (const framework of config.stack.frameworks) {
    if (UNSUPPORTED_TEMPLATES.has(framework))
      throw new Error(`Template ${framework} is not implemented.`);
  }
}

export async function requireEmptyDestination(directory: string): Promise<void> {
  const stat = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (!stat) return;
  if (!stat.isDirectory() || stat.isSymbolicLink() || (await fs.readdir(directory)).length)
    throw new Error(`Initialization destination must be an empty directory: ${directory}`);
}

export async function formatGeneratedFiles(directory: string, files: string[]): Promise<void> {
  for (const file of new Set(files)) {
    if (file.startsWith('.yarn/') || file.endsWith('.lock')) continue;
    const full = path.join(directory, file);
    const info = await getFileInfo(full);
    const parser = file === '.prettierrc' ? 'json' : info.inferredParser;
    if (!parser) continue;
    await fs.writeFile(
      full,
      await format(await fs.readFile(full, 'utf8'), {
        parser,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
      }),
    );
  }
}
