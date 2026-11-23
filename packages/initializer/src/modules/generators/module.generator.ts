import fs from 'node:fs/promises';
import path from 'node:path';
import type { BootstrapConfig, Language } from '../../types/index.js';
import { formatFileName, getLanguageExtension, getTestFileName } from '../architecture/index.js';
import { BootstrapConfigSchema } from '../validation/index.js';

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
): Promise<string[]> {
  const lang = language ?? config.stack.languages[0] ?? 'typescript';
  const ext = getLanguageExtension(lang);
  const words = moduleName.split(/[-_\s]+/);
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
  const mainContent =
    lang === 'typescript'
      ? `export function execute${formatFileName(words, 'PascalCase')}(): string {\n  return 'Good news, everyone! ${moduleName} delivered.';\n}\n`
      : lang === 'golang'
        ? `package ${formatFileName(words, 'snake_case')}\n\nfunc Execute() string {\n\treturn "Good news, everyone! ${moduleName} delivered."\n}\n`
        : lang === 'rust'
          ? `pub fn execute() -> &'static str {\n    "Good news, everyone! ${moduleName} delivered."\n}\n`
          : `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract ${formatFileName(words, 'PascalCase')} {\n    string public greeting = "Good news, everyone!";\n}\n`;

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

  const testContent =
    lang === 'typescript'
      ? `import { describe, it, expect } from 'vitest';\n\ndescribe('${moduleName}', () => {\n  it('delivers the Planet Express package', () => {\n    expect(true).toBe(true);\n  });\n});\n`
      : `// Test stub for ${moduleName}\n`;

  await fs.writeFile(testPath, testContent, 'utf-8');
  created.push(path.relative(targetDir, testPath));

  // Barrel export
  if (config.architecture.barrelExports && lang === 'typescript') {
    const barrelPath = path.join(moduleDir, 'index.ts');
    await fs.writeFile(barrelPath, `export * from './${baseName}.js';\n`, 'utf-8');
    created.push(path.relative(targetDir, barrelPath));
  }

  return created;
}
