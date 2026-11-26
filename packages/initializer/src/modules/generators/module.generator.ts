import { formatGeneratedFiles } from './initialization-safety.js';
import { scaffoldNativeModule } from './native-module.generator.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BootstrapConfig, Language } from '../../types/index.js';
import { formatFileName, getLanguageExtension, getTestFileName } from '../architecture/index.js';
import { ModuleNameSchema, BootstrapConfigSchema } from '../validation/index.js';

export async function loadBootstrapConfig(dir: string): Promise<BootstrapConfig | null> {
  try {
    const raw = await fs.readFile(path.join(dir, 'bootstrap.config.json'), 'utf-8');
    const parsed = BootstrapConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function generateModule(
  targetDir: string,
  moduleName: string,
  config: BootstrapConfig,
  language?: Language,
  workspace?: string,
): Promise<string[]> {
  ModuleNameSchema.parse(moduleName);
  const entries = [...config.workspace.apps, ...config.workspace.packages];
  const selected = workspace
    ? entries.find(
        (entry) =>
          entry.name === workspace ||
          `${config.workspace.apps.includes(entry) ? 'apps' : 'packages'}/${entry.name}` ===
            workspace,
      )
    : (config.workspace.apps.find(
        (entry) => entry.kind === 'backend' && entry.language !== 'typescript',
      ) ?? entries.find((entry) => entry.language === language && entry.language !== 'typescript'));
  if (workspace && !selected) throw new Error(`Unknown workspace: ${workspace}`);
  const lang = selected?.language ?? language ?? config.stack.languages[0] ?? 'typescript';
  if (lang === 'rust' || lang === 'golang') {
    if (!selected) throw new Error('Native module generation requires an existing workspace.');
    return scaffoldNativeModule(targetDir, moduleName, config, selected);
  }
  const base = selected
    ? `${config.workspace.apps.includes(selected) ? 'apps' : 'packages'}/${selected.name}`
    : '';
  targetDir = path.join(targetDir, base);
  const ext = getLanguageExtension(lang);
  const words = moduleName.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const baseName = formatFileName(words, config.architecture.fileNaming);
  const testFileName = getTestFileName(baseName, lang);

  const created: string[] = [];
  const srcRoot = path.join(targetDir, 'src');

  let moduleDir = srcRoot;
  if (config.architecture.pattern === 'modular') {
    moduleDir = path.join(srcRoot, 'modules', baseName);
  } else if (config.architecture.pattern === 'vertical-slice') {
    moduleDir = path.join(srcRoot, 'features', baseName);
  } else if (config.architecture.pattern === 'layered') {
    moduleDir = path.join(srcRoot, 'services');
  } else if (config.architecture.pattern === 'hexagonal') {
    moduleDir = path.join(srcRoot, 'domain');
  } else if (config.architecture.pattern === 'clean') {
    moduleDir = path.join(srcRoot, 'use-cases');
  }

  await fs.mkdir(moduleDir, { recursive: true });

  const mainFile = path.join(moduleDir, `${baseName}.${ext}`);
  const scope = `@${config.project.name}`;
  const tsContractsPkg = config.workspace.packages.find(
    (p) => (p.kind === 'contracts' || p.name === 'contracts') && p.language === 'typescript',
  );
  const contractsImport =
    tsContractsPkg && (!selected || selected.kind === 'backend')
      ? `${scope}/${tsContractsPkg.name}`
      : null;
  const mainContent =
    lang === 'typescript'
      ? moduleName === 'health' && contractsImport
        ? `import { HEALTH_ENDPOINT_PATH, createHealthPayload, type HealthResponse } from '${contractsImport}';\n\nexport const HEALTH_PATH = HEALTH_ENDPOINT_PATH;\n\nexport function getHealthResponse(): HealthResponse {\n  return createHealthPayload('${scope}/api');\n}\n`
        : `export function execute${formatFileName(words, 'PascalCase')}(): string {\n  return 'Good news, everyone! ${moduleName} delivered.';\n}\n`
      : `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract ${formatFileName(words, 'PascalCase')} {\n    string public greeting = "Good news, everyone!";\n}\n`;

  if (
    await fs.lstat(mainFile).then(
      () => true,
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
        return false;
      },
    )
  )
    throw new Error(`Module already exists: ${mainFile}`);
  await fs.writeFile(mainFile, mainContent, 'utf-8');
  created.push(path.relative(targetDir, mainFile));

  // Test file placement
  let testPath: string;
  if (config.architecture.testOrganization === 'colocated') {
    testPath = path.join(moduleDir, testFileName);
  } else if (config.architecture.testOrganization === 'dedicated-tests') {
    const testsDir = path.join(moduleDir, '__tests__');
    await fs.mkdir(testsDir, { recursive: true });
    testPath = path.join(testsDir, testFileName);
  } else {
    const rootTestsDir = path.join(targetDir, 'tests');
    await fs.mkdir(rootTestsDir, { recursive: true });
    testPath = path.join(rootTestsDir, testFileName);
  }

  const importPrefix =
    config.architecture.testOrganization === 'colocated'
      ? './'
      : config.architecture.testOrganization === 'dedicated-tests'
        ? '../'
        : '../src/' +
          path.relative(path.join(targetDir, 'src'), moduleDir).replaceAll(path.sep, '/') +
          '/';
  const testContent =
    lang === 'typescript'
      ? moduleName === 'health' && contractsImport
        ? `import { describe, it, expect } from 'vitest';\nimport { getHealthResponse, HEALTH_PATH } from '${importPrefix}${baseName}.js';\ndescribe('${moduleName}', () => { it('returns the shared health response', () => { const res = getHealthResponse(); expect(res.status).toBe('ok'); expect(HEALTH_PATH).toBe('/health'); }); });\n`
        : `import { describe, it, expect } from 'vitest';\nimport { execute${formatFileName(words, 'PascalCase')} } from '${importPrefix}${baseName}.js';\ndescribe('${moduleName}', () => { it('executes generated behavior', () => { expect(execute${formatFileName(words, 'PascalCase')}()).toBe('Good news, everyone! ${moduleName} delivered.'); }); });\n`
      : `// Test stub for ${moduleName}\n`;

  await fs.writeFile(testPath, testContent, 'utf-8');
  created.push(path.relative(targetDir, testPath));

  // Barrel export
  if (config.architecture.barrelExports && lang === 'typescript') {
    const barrelPath = path.join(moduleDir, 'index.ts');
    const previous = await fs.readFile(barrelPath, 'utf8').catch(() => '');
    const line = `export * from './${baseName}.js';`;
    if (!previous.includes(line)) await fs.writeFile(barrelPath, previous + line + '\n', 'utf-8');
    created.push(path.relative(targetDir, barrelPath));
  }

  await formatGeneratedFiles(targetDir, created);
  return created.map((file) => path.join(base, file));
}
