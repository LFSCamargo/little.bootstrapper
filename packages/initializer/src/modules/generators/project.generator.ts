import { scaffoldLocalValidation } from './local-validation.generator.js';
import {
  validateInitialization,
  requireEmptyDestination,
  formatGeneratedFiles,
} from './initialization-safety.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BootstrapConfig, Framework } from '../../types/index.js';
import { getPinnedVersion } from '../catalog/index.js';
import { generateUniversalAIEcosystem } from './ai-ecosystem.generator.js';
import { generateMcpConfig } from './mcp.generator.js';
import { generateModule } from './module.generator.js';
import { hasNativeWorkspaces, nativePlugins, scaffoldNativeTooling } from './native.generator.js';
import { WorkspaceEntrySchema } from '../validation/index.js';
import {
  isPrettierEnabled,
  resolveRootLinter,
  scaffoldExternalPipeline,
  scaffoldRootTooling,
  scaffoldWorkspaceApp,
  scaffoldWorkspacePackage,
} from './workspace.generator.js';

export interface GenerationResult {
  targetDir: string;
  filesCreated: string[];
  uiPackagesCreated: ('ui-cli' | 'ui-web' | 'ui-mobile')[];
}

const WEB_FRAMEWORKS: Framework[] = [
  'nextjs',
  'react-vite',
  'nuxtjs',
  'tauri',
  'shadcn',
  'aceternity-ui',
  'inspira-ui',
  'magic-ui',
  'park-ui',
];
const MOBILE_FRAMEWORKS: Framework[] = [
  'react-native',
  'lynx',
  'nativewind',
  'stylesheets',
  'uniwind',
  'unistyles',
  'tamagui',
];

function renderVitestConfig(coverage: { enabled: boolean; threshold: number }): string {
  const coverageBlock = coverage.enabled
    ? `    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      // Entry mounting is exercised by browser E2E; application logic remains covered.
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/**', 'src/main.tsx'],
      thresholds: {
        lines: ${coverage.threshold},
        statements: ${coverage.threshold},
        functions: ${coverage.threshold},
        branches: ${coverage.threshold},
      },
    },`
    : `    coverage: {
      enabled: false,
    },`;

  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
${coverageBlock}
  },
});
`;
}

function renderJestConfig(coverage: { enabled: boolean; threshold: number }): string {
  const thresholdBlock = coverage.enabled
    ? `  coverageThreshold: {
    global: {
      lines: ${coverage.threshold},
      statements: ${coverage.threshold},
      functions: ${coverage.threshold},
      branches: ${coverage.threshold},
    },
  },`
    : '';

  return `export default {
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverage: ${coverage.enabled},
${thresholdBlock}
};
`;
}

export function resolveRequiredUiPackages(
  config: BootstrapConfig,
): ('ui-cli' | 'ui-web' | 'ui-mobile')[] {
  const appFrameworks = new Set<Framework>(config.workspace.apps.map((a) => a.framework));

  const required: ('ui-cli' | 'ui-web' | 'ui-mobile')[] = [];

  if (WEB_FRAMEWORKS.some((f) => appFrameworks.has(f))) {
    required.push('ui-web');
  }
  if (MOBILE_FRAMEWORKS.some((f) => appFrameworks.has(f))) {
    required.push('ui-mobile');
  }

  return required;
}

async function scaffoldSeparatedUiPackage(
  targetDir: string,
  kind: 'ui-cli' | 'ui-web' | 'ui-mobile',
  config: BootstrapConfig,
): Promise<string[]> {
  const created: string[] = [];
  const pkgRoot = path.join(targetDir, 'packages', kind);
  await fs.mkdir(path.join(pkgRoot, 'src'), { recursive: true });

  const scope = `@${config.project.name}`;

  if (kind === 'ui-cli') {
    const pkgJson = {
      name: `${scope}/ui-cli`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: 'src/index.ts',
      scripts: {
        build: 'tsc -p tsconfig.json',
        typecheck: 'tsc --noEmit -p tsconfig.json',
      },
      dependencies: {
        '@inkjs/ui': getPinnedVersion('@inkjs/ui'),
        ink: getPinnedVersion('ink'),
        react: getPinnedVersion('react'),
      },
      devDependencies: {
        typescript: getPinnedVersion('typescript'),
      },
    };
    await fs.writeFile(
      path.join(pkgRoot, 'package.json'),
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(pkgRoot, 'tsconfig.json'),
      `${JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: { outDir: 'dist', rootDir: 'src' },
          include: ['src/**/*'],
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(pkgRoot, 'src', 'index.ts'),
      `// Shared React Ink + @inkjs/ui Animated CLI Components for ${config.project.name}
export const UI_CLI_KIND = 'ui-cli' as const;
export {
  Alert,
  Badge,
  ConfirmInput,
  MultiSelect,
  ProgressBar,
  Select,
  Spinner,
  StatusMessage,
  ThemeProvider,
  defaultTheme,
  extendTheme,
} from '@inkjs/ui';
`,
      'utf-8',
    );
    created.push(
      'packages/ui-cli/package.json',
      'packages/ui-cli/tsconfig.json',
      'packages/ui-cli/src/index.ts',
    );
    if (config.stack.frameworks.includes('vitest')) {
      const cov = config.testing?.coverage ?? { enabled: true, threshold: 75 };
      await fs.writeFile(path.join(pkgRoot, 'vitest.config.ts'), renderVitestConfig(cov), 'utf-8');
      created.push('packages/ui-cli/vitest.config.ts');
    }
  } else if (kind === 'ui-web') {
    const deps: Record<string, string> = {
      clsx: getPinnedVersion('clsx'),
      'tailwind-merge': getPinnedVersion('tailwind-merge'),
    };
    if (config.stack.frameworks.includes('shadcn')) {
      deps['class-variance-authority'] = getPinnedVersion('class-variance-authority');
      deps['@radix-ui/react-slot'] = getPinnedVersion('@radix-ui/react-slot');
    }
    if (
      config.stack.frameworks.includes('aceternity-ui') ||
      config.stack.frameworks.includes('framer-motion')
    ) {
      deps['framer-motion'] = getPinnedVersion('framer-motion');
    }
    const pkgJson = {
      name: `${scope}/ui-web`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: 'src/index.ts',
      scripts: {
        build: 'tsc -p tsconfig.json',
        typecheck: 'tsc --noEmit -p tsconfig.json',
      },
      dependencies: deps,
      peerDependencies: {
        react: getPinnedVersion('react'),
        'react-dom': getPinnedVersion('react-dom'),
      },
      devDependencies: {
        react: getPinnedVersion('react'),
        'react-dom': getPinnedVersion('react-dom'),
        '@types/react': getPinnedVersion('@types/react'),
        typescript: getPinnedVersion('typescript'),
      },
    };
    await fs.writeFile(
      path.join(pkgRoot, 'package.json'),
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(pkgRoot, 'tsconfig.json'),
      `${JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: { outDir: 'dist', rootDir: 'src' },
          include: ['src/**/*'],
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(pkgRoot, 'src', 'index.ts'),
      `// Shared Web UI Components (ShadCN + Aceternity UI) for ${config.project.name}\nexport const UI_WEB_KIND = 'ui-web' as const;\n`,
      'utf-8',
    );
    created.push(
      'packages/ui-web/package.json',
      'packages/ui-web/tsconfig.json',
      'packages/ui-web/src/index.ts',
    );
    if (config.stack.frameworks.includes('vitest')) {
      const cov = config.testing?.coverage ?? { enabled: true, threshold: 75 };
      await fs.writeFile(path.join(pkgRoot, 'vitest.config.ts'), renderVitestConfig(cov), 'utf-8');
      created.push('packages/ui-web/vitest.config.ts');
    }

    if (
      config.stack.frameworks.includes('shadcn') ||
      config.stack.frameworks.includes('aceternity-ui')
    ) {
      const componentsJson = {
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'new-york',
        rsc: true,
        tsx: true,
        aliases: {
          components: `${scope}/ui-web/shadcn`,
          utils: `${scope}/ui-web/lib/utils`,
        },
        registries: {
          '@aceternity': 'https://ui.aceternity.com/registry/{name}.json',
          '@aceternity-pro': {
            url: 'https://pro.aceternity.com/registry/{name}.json',
            headers: { Authorization: 'Bearer ${ACETERNITY_PRO_API_KEY}' },
          },
        },
      };
      await fs.writeFile(
        path.join(pkgRoot, 'components.json'),
        `${JSON.stringify(componentsJson, null, 2)}\n`,
        'utf-8',
      );
      created.push('packages/ui-web/components.json');
    }
  } else {
    const deps: Record<string, string> = {};
    if (config.stack.frameworks.includes('nativewind')) {
      deps.nativewind = getPinnedVersion('nativewind');
    }
    if (config.stack.frameworks.includes('tamagui')) {
      deps.tamagui = getPinnedVersion('tamagui');
    }
    const pkgJson = {
      name: `${scope}/ui-mobile`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: 'src/index.ts',
      scripts: {
        build: 'tsc -p tsconfig.json',
        typecheck: 'tsc --noEmit -p tsconfig.json',
      },
      dependencies: deps,
      devDependencies: {
        typescript: getPinnedVersion('typescript'),
      },
    };
    await fs.writeFile(
      path.join(pkgRoot, 'package.json'),
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(pkgRoot, 'tsconfig.json'),
      `${JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: { outDir: 'dist', rootDir: 'src' },
          include: ['src/**/*'],
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(pkgRoot, 'src', 'index.ts'),
      `// Shared Mobile UI Components (React Native / Lynx) for ${config.project.name}\nexport const UI_MOBILE_KIND = 'ui-mobile' as const;\n`,
      'utf-8',
    );
    created.push(
      'packages/ui-mobile/package.json',
      'packages/ui-mobile/tsconfig.json',
      'packages/ui-mobile/src/index.ts',
    );
  }

  return created;
}

export async function generateProject(
  targetDir: string,
  config: BootstrapConfig,
): Promise<GenerationResult> {
  validateInitialization(config);
  await requireEmptyDestination(targetDir);
  const parent = path.dirname(path.resolve(targetDir));
  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, '.bootstrap-init-'));
  try {
    const result = await writeProject(staging, config);
    await requireEmptyDestination(targetDir);
    const existing = await fs.stat(targetDir).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (existing) {
      // A shell may be inside this directory. Keep its inode and publish only new files.
      const published: string[] = [];
      const directories: string[] = [];
      try {
        async function publish(directory: string): Promise<void> {
          for (const entry of await fs.readdir(path.join(staging, directory), {
            withFileTypes: true,
          })) {
            const file = path.join(directory, entry.name);
            const destination = path.join(targetDir, file);
            if (entry.isDirectory()) {
              await fs.mkdir(destination);
              directories.push(destination);
              await publish(file);
            } else {
              await fs.copyFile(path.join(staging, file), destination, fs.constants.COPYFILE_EXCL);
              published.push(destination);
            }
          }
        }
        await publish('');
      } catch (error) {
        for (const file of published.reverse()) await fs.unlink(file);
        for (const directory of directories.reverse()) await fs.rmdir(directory);
        throw error;
      }
    } else {
      await fs.chmod(staging, 0o777 & ~process.umask());
      await fs.rename(staging, targetDir);
    }
    return { ...result, targetDir };
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

async function writeProject(targetDir: string, config: BootstrapConfig): Promise<GenerationResult> {
  config = {
    ...config,
    stack: {
      ...config.stack,
      languages: [
        ...new Set([
          ...config.stack.languages,
          ...config.workspace.apps.map((e) => e.language),
          ...config.workspace.packages.map((e) => e.language),
        ]),
      ],
      frameworks: [
        ...new Set([
          'vitest' as const,
          ...config.stack.frameworks,
          ...config.workspace.apps.map((e) => e.framework),
          ...config.workspace.packages.map((e) => e.framework),
        ]),
      ],
      useMakefiles: false,
    },
  };
  const hasTs = config.stack.languages.includes('typescript');
  const useNx = config.stack.monorepo || hasNativeWorkspaces(config);
  const names = new Set<string>();
  for (const entry of [...config.workspace.apps, ...config.workspace.packages]) {
    WorkspaceEntrySchema.parse(entry);
    if (names.has(entry.name)) throw new Error(`Duplicate workspace name: ${entry.name}`);
    names.add(entry.name);
  }
  const filesCreated: string[] = [];
  await fs.mkdir(targetDir, { recursive: true });

  // 1. Persist bootstrap.config.json
  const configPath = path.join(targetDir, 'bootstrap.config.json');
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  filesCreated.push('bootstrap.config.json');
  await fs.writeFile(
    path.join(targetDir, '.gitignore'),
    'node_modules/\ndist/\nartifacts/\ncache/\nout/\n.next/\n.nuxt/\n.output/\n.nx/\ncoverage/\ntarget/\n.env*\n!.env.example\n*.tsbuildinfo\n.yarn/install-state.gz\n',
  );
  filesCreated.push('.gitignore');

  // 2. CODEOWNERS
  if (config.project.codeowners) {
    const codeownersPath = path.join(targetDir, 'CODEOWNERS');
    await fs.writeFile(codeownersPath, `* @${config.project.author}\n`, 'utf-8');
    filesCreated.push('CODEOWNERS');
  }

  const coverage = config.testing?.coverage ?? { enabled: true, threshold: 75 };
  const rootLinter = resolveRootLinter(config);
  const prettierEnabled = isPrettierEnabled(config);

  // 3. Root package.json + tsconfig.json + root-only linter & prettier (if TypeScript is selected)
  if (hasTs || useNx) {
    const devDeps: Record<string, string> = {
      ...(hasTs
        ? {
            typescript: getPinnedVersion('typescript'),
            '@types/node': getPinnedVersion('@types/node'),
          }
        : {}),
    };
    if (useNx) {
      devDeps.nx = getPinnedVersion('nx');
      for (const plugin of nativePlugins(config)) devDeps[plugin] = getPinnedVersion(plugin);
    }
    if (config.stack.frameworks.includes('vitest')) {
      devDeps.vitest = getPinnedVersion('vitest');
      if (coverage.enabled) {
        devDeps['@vitest/coverage-v8'] = getPinnedVersion('@vitest/coverage-v8');
      }
    }
    if (config.stack.frameworks.includes('jest')) {
      devDeps.jest = getPinnedVersion('jest');
    }
    if (config.stack.frameworks.includes('playwright')) {
      devDeps['@playwright/test'] = getPinnedVersion('@playwright/test');
    }
    if (hasTs && (rootLinter === 'eslint' || config.stack.frameworks.includes('eslint'))) {
      devDeps.eslint = getPinnedVersion('eslint');
      devDeps['@typescript-eslint/parser'] = getPinnedVersion('@typescript-eslint/parser');
    }
    if (rootLinter === 'biome' || config.stack.frameworks.includes('biome')) {
      devDeps['@biomejs/biome'] = getPinnedVersion('@biomejs/biome');
    }
    if (rootLinter === 'oxlint' || config.stack.frameworks.includes('oxc')) {
      devDeps.oxlint = getPinnedVersion('oxlint');
    }
    if (
      prettierEnabled ||
      config.stack.frameworks.includes('prettier') ||
      config.stack.tools.includes('commitlint-husky-prettier')
    ) {
      devDeps.prettier = getPinnedVersion('prettier');
    }
    if (config.stack.tools.includes('commitlint-husky-prettier')) {
      devDeps.husky = getPinnedVersion('husky');
      devDeps['@commitlint/cli'] = getPinnedVersion('@commitlint/cli');
      devDeps['@commitlint/config-conventional'] = getPinnedVersion(
        '@commitlint/config-conventional',
      );
    }

    const deps: Record<string, string> = {};
    if (config.stack.frameworks.includes('ink')) {
      deps['@inkjs/ui'] = getPinnedVersion('@inkjs/ui');
      deps.ink = getPinnedVersion('ink');
      deps.react = getPinnedVersion('react');
    }

    const lintScript =
      rootLinter === 'eslint'
        ? 'eslint .'
        : rootLinter === 'biome'
          ? 'biome lint .'
          : rootLinter === 'oxlint'
            ? 'oxlint .'
            : 'echo "No root linter configured"';

    const pkgJson: Record<string, unknown> = {
      name: config.project.name,
      version: '0.1.0',
      private: useNx,
      description: config.project.description,
      author: config.project.author,
      ...(config.stack.packageManager === 'yarn' ? { packageManager: 'yarn@4.19.0' } : {}),
      ...(useNx && config.stack.packageManager !== 'pnpm'
        ? { workspaces: ['apps/*', 'packages/*'] }
        : {}),
      scripts: {
        build: useNx ? 'nx run-many -t build' : 'tsc',
        test: useNx
          ? 'nx run-many -t test'
          : config.stack.frameworks.includes('vitest')
            ? 'vitest run'
            : config.stack.frameworks.includes('jest')
              ? 'jest'
              : 'echo "No test runner configured"',
        ...(coverage.enabled && config.stack.frameworks.includes('vitest')
          ? { 'test:coverage': useNx ? 'nx run-many -t test' : 'vitest run --coverage' }
          : coverage.enabled && config.stack.frameworks.includes('jest')
            ? { 'test:coverage': 'jest --coverage' }
            : {}),
        typecheck: useNx ? 'nx run-many -t typecheck' : 'tsc --noEmit',
        lint: hasTs ? lintScript : 'nx run-many -t typecheck',
        ...(useNx
          ? {
              start: 'nx run-many -t start --parallel=100',
              dev: 'nx run-many -t dev --parallel=100',
            }
          : {}),
        ...(prettierEnabled
          ? {
              format: 'prettier --write .',
              'format:check': 'prettier --check .',
            }
          : {}),
        pipeline: 'bash scripts/pipeline.sh --all',
      },
      ...(Object.keys(deps).length > 0 ? { dependencies: deps } : {}),
      devDependencies: devDeps,
    };

    await fs.writeFile(
      path.join(targetDir, 'package.json'),
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      'utf-8',
    );
    filesCreated.push('package.json');

    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: true,
        ...(config.architecture.pathAliases ? { baseUrl: '.', paths: { '@/*': ['./src/*'] } } : {}),
      },
    };
    await fs.writeFile(
      path.join(targetDir, 'tsconfig.json'),
      `${JSON.stringify(tsconfig, null, 2)}\n`,
      'utf-8',
    );
    filesCreated.push('tsconfig.json');

    if (config.stack.frameworks.includes('vitest')) {
      await fs.writeFile(
        path.join(targetDir, 'vitest.config.ts'),
        renderVitestConfig(coverage),
        'utf-8',
      );
      filesCreated.push('vitest.config.ts');
    } else if (config.stack.frameworks.includes('jest')) {
      await fs.writeFile(
        path.join(targetDir, 'jest.config.ts'),
        renderJestConfig(coverage),
        'utf-8',
      );
      filesCreated.push('jest.config.ts');
    }

    if (config.stack.packageManager === 'yarn') {
      const yarnRelease = 'yarn-4.19.0.cjs';

      const releasePaths = [
        path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          '../../../../../.yarn/releases',
          yarnRelease,
        ),
        path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          '../../../.yarn/releases',
          yarnRelease,
        ),
      ];
      let releaseSource: string | undefined;
      for (const candidate of releasePaths) {
        try {
          await fs.access(candidate);
          releaseSource = candidate;
          break;
        } catch {
          /* ignore */
        }
      }
      await fs.writeFile(
        path.join(targetDir, '.yarnrc.yml'),
        'nodeLinker: node-modules\nenableTelemetry: false\n' +
          (releaseSource ? `yarnPath: .yarn/releases/${yarnRelease}\n` : ''),
      );
      filesCreated.push('.yarnrc.yml');
      if (releaseSource) {
        const releaseDest = path.join(targetDir, '.yarn/releases', yarnRelease);
        await fs.mkdir(path.dirname(releaseDest), { recursive: true });
        await fs.copyFile(releaseSource, releaseDest);
        filesCreated.push('.yarn/releases/yarn-4.19.0.cjs');
      }
    }

    if (useNx && config.stack.packageManager === 'pnpm') {
      await fs.writeFile(
        path.join(targetDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "apps/*"\n  - "packages/*"\n',
        'utf-8',
      );
      filesCreated.push('pnpm-workspace.yaml');
    }

    if (useNx) {
      const nxJson = {
        $schema: './node_modules/nx/schemas/nx-schema.json',
        defaultBase: 'main',
        plugins: nativePlugins(config),
        targetDefaults: {
          build: { dependsOn: ['^build'] },
          typecheck: { dependsOn: ['^build'] },
          test: { dependsOn: ['^build'] },
          dev: { dependsOn: ['^build'] },
          start: { dependsOn: ['build'] },
        },
      };
      await fs.writeFile(
        path.join(targetDir, 'nx.json'),
        `${JSON.stringify(nxJson, null, 2)}\n`,
        'utf-8',
      );
      filesCreated.push('nx.json');
    }
  }

  // 4. Root-only Linter, Prettier (default), tsconfig.base.json & Security Configs
  const rootToolFiles = await scaffoldRootTooling(targetDir, config);
  filesCreated.push(...rootToolFiles);

  if (config.stack.tools.includes('security-checker')) {
    await fs.writeFile(
      path.join(targetDir, '.opengrep.yml'),
      `rules:\n  - id: no-eval\n    pattern: eval(...)\n    message: "Avoid eval()"\n    languages: [typescript, javascript]\n    severity: ERROR\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(targetDir, '.gitleaks.toml'),
      `title = "${config.project.name} GitLeaks Config"\n[extend]\nuseDefault = true\n`,
      'utf-8',
    );
    filesCreated.push('.opengrep.yml', '.gitleaks.toml');
  }

  if (config.stack.tools.includes('commitlint-husky-prettier')) {
    await fs.writeFile(
      path.join(targetDir, 'commitlint.config.mjs'),
      `export default { extends: ['@commitlint/config-conventional'] };\n`,
      'utf-8',
    );
    await fs.mkdir(path.join(targetDir, '.husky'), { recursive: true });
    await fs.writeFile(
      path.join(targetDir, '.husky', 'commit-msg'),
      'npx commitlint --edit "$1"\n',
      'utf-8',
    );
    filesCreated.push('commitlint.config.mjs', '.husky/commit-msg');
  }

  if (config.stack.frameworks.includes('aceternity-ui')) {
    await fs.writeFile(
      path.join(targetDir, '.env.example'),
      `ACETERNITY_PRO_API_KEY=your_key_here\nACETERNITY_PRO_LICENSE_KEY=your_license_here\nNEXT_PUBLIC_ACETERNITY_PRO_ENABLED=true\n`,
      'utf-8',
    );
    filesCreated.push('.env.example');
  }

  // 6. Mandatory Separated UI Packages (ui-cli, ui-web, ui-mobile)
  const uiPackagesCreated = resolveRequiredUiPackages(config);
  for (const uiKind of uiPackagesCreated) {
    const uiFiles = await scaffoldSeparatedUiPackage(targetDir, uiKind, config);
    filesCreated.push(...uiFiles);
  }

  // 7. Initialized Workspace Packages & Apps (Contracts, Backend Health Endpoint, Web Sample App)
  const scope = `@${config.project.name}`;
  const tsContractsPkg = config.workspace.packages.find(
    (p) => (p.kind === 'contracts' || p.name === 'contracts') && p.language === 'typescript',
  );
  const contractsPkgName = tsContractsPkg ? `${scope}/${tsContractsPkg.name}` : null;
  const hasUiWeb = uiPackagesCreated.includes('ui-web');

  for (const pkg of config.workspace.packages) {
    if (pkg.name === 'ui-cli' || pkg.name === 'ui-web' || pkg.name === 'ui-mobile') {
      continue;
    }
    const pkgFiles = await scaffoldWorkspacePackage(targetDir, pkg, config);
    filesCreated.push(...pkgFiles);
  }

  for (const app of config.workspace.apps) {
    const appFiles = await scaffoldWorkspaceApp(targetDir, app, config, contractsPkgName, hasUiWeb);
    filesCreated.push(...appFiles);
  }

  for (const bucket of ['apps', 'packages'] as const) {
    for (const entry of config.workspace[bucket]) {
      const base = `${bucket}/${entry.name}`;
      const manifest = await fs
        .readFile(path.join(targetDir, base, 'package.json'), 'utf8')
        .catch(() => null);
      if (manifest && JSON.parse(manifest).scripts?.test === 'vitest run') {
        if (!filesCreated.includes(`${base}/vitest.config.ts`))
          await fs.writeFile(
            path.join(targetDir, base, 'vitest.config.ts'),
            "export { default } from '../../vitest.config.js';\n",
          );
        filesCreated.push(`${base}/vitest.config.ts`);
      }
    }
  }
  filesCreated.push(...(await scaffoldNativeTooling(targetDir, config)));

  // 7b. External Bootstrap & Delivery Pipeline + Architecture Documentation
  const pipelineFiles = await scaffoldExternalPipeline(targetDir, config, uiPackagesCreated);
  filesCreated.push(...pipelineFiles);

  // 8. Example health module following architecture & naming conventions
  if (config.architecture.exampleModule) {
    const primaryLang = config.stack.languages[0] ?? 'typescript';
    const exampleWorkspace =
      config.workspace.apps.find((entry) => entry.kind === 'backend') ??
      config.workspace.apps[0] ??
      config.workspace.packages.find((entry) => entry.language !== 'solidity');
    const exampleFiles = exampleWorkspace
      ? await generateModule(targetDir, 'health', config, primaryLang, exampleWorkspace.name)
      : [];
    filesCreated.push(...exampleFiles);
  }

  // 9. Universal AI Ecosystem
  const aiFiles = await generateUniversalAIEcosystem(targetDir, config);
  filesCreated.push(...aiFiles);

  // 9b. Verified Safe MCPs (mcp.json + agent bridges)
  if (config.stack.mcps && config.stack.mcps.length > 0) {
    const mcpRes = await generateMcpConfig(targetDir, config.stack.mcps, config.stack.agents);
    filesCreated.push(...mcpRes.filesWritten);
  }

  // 10. CHANGELOG.md & GitHub PR Validation + Tag Release Pipelines
  await fs.writeFile(
    path.join(targetDir, 'CHANGELOG.md'),
    `# Changelog\n\nAll notable changes to **${config.project.name}** are documented here.\n\n## [0.1.0] - ${new Date().toISOString().slice(0, 10)}\n\n### Added\n- Initial scaffold bootstrapped with little.bootstrapper.\n`,
    'utf-8',
  );
  filesCreated.push('CHANGELOG.md');

  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  await fs.mkdir(workflowsDir, { recursive: true });
  const coverageCiStep =
    coverage.enabled &&
    (config.stack.frameworks.includes('vitest') || config.stack.frameworks.includes('jest'))
      ? `      - run: ${config.stack.packageManager} test:coverage\n`
      : '';
  const runCmd = config.stack.packageManager === 'npm' ? 'npm run' : config.stack.packageManager;
  const nativeCiSteps = `${config.stack.languages.includes('golang') ? "      - uses: actions/setup-go@v5\n        with:\n          go-version: '1.23.x'\n          cache: false\n" : ''}${config.stack.languages.includes('rust') ? '      - uses: dtolnay/rust-toolchain@stable\n' : ''}${config.stack.frameworks.includes('foundry') ? '      - uses: foundry-rs/foundry-toolchain@v1\n' : ''}`;
  await fs.writeFile(
    path.join(workflowsDir, 'pr-validation.yml'),
    `name: PR Validation & Pattern Gate\non:\n  pull_request:\n    branches: [main]\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n${nativeCiSteps}${config.stack.packageManager === 'yarn' ? '      - run: corepack enable\n' : ''}      - run: ${config.stack.packageManager} install\n${
      config.stack.languages.includes('golang')
        ? config.workspace.apps
            .concat(config.workspace.packages)
            .filter((e) => e.language === 'golang')
            .map(
              (e) =>
                `      - run: go mod tidy\n        working-directory: ${config.workspace.apps.includes(e) ? 'apps' : 'packages'}/${e.name}\n`,
            )
            .join('')
        : ''
    }${prettierEnabled ? `      - run: ${runCmd} format:check\n` : ''}${rootLinter !== 'none' ? `      - run: ${runCmd} lint\n` : ''}      - run: ${runCmd} typecheck\n      - run: ${runCmd} build\n      - run: ${runCmd} test\n      - run: node scripts/validate.mjs\n${coverageCiStep}`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(workflowsDir, 'release.yml'),
    `name: Tag Release\non:\n  push:\n    tags:\n      - 'v*.*.*'\njobs:\n  release:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: softprops/action-gh-release@v2\n        with:\n          generate_release_notes: true\n`,
    'utf-8',
  );
  filesCreated.push('.github/workflows/pr-validation.yml', '.github/workflows/release.yml');

  // 11. README.md
  const appsDoc = config.workspace.apps
    .map((a) => `- \`apps/${a.name}\` (${a.language} / ${a.framework})`)
    .join('\n');
  const pkgsDoc = [
    ...config.workspace.packages.map(
      (p) => `- \`packages/${p.name}\` (${p.language} / ${p.framework})`,
    ),
    ...uiPackagesCreated.map((u) => `- \`packages/${u}\` (separated UI package)`),
  ].join('\n');

  const readme = `# ${config.project.name}

> ${config.project.description}

Bootstrapped with **little.bootstrapper**, a library and CLI for consistent project setup.

## Quickstart & External Pipeline

Run the standalone delivery pipeline outside the CLI:

\`\`\`bash
./scripts/pipeline.sh --all
\`\`\`

See [docs/PIPELINE.md](./docs/PIPELINE.md) for full pipeline stages, root-only linting, and workspace verification.

${hasNativeWorkspaces(config) ? '## Native workspace commands\n\nInstall Go / Rust / Foundry as needed, then install workspace dependencies. Nx orchestrates all languages without Makefiles. Run nx run-many -t build / test or nx run <project>:start. Go uses @nx-go/nx-go with go.work; Rust uses @monodon/rust with a root Cargo workspace; Foundry runs forge and anvil through nx:run-commands. Libraries expose build/test/typecheck targets only. Run go mod tidy in Go workspaces before the first build to populate go.sum.\n' : ''}

## Stack

- **Languages**: ${config.stack.languages.join(', ')}
- **Package Manager**: ${config.stack.packageManager}
- **Root Linter**: ${rootLinter} (root only)
- **Root Formatter**: Prettier (${prettierEnabled ? 'enabled at root by default' : 'disabled'})
- **Frameworks**: ${config.stack.frameworks.join(', ') || 'None'}
- **Separated UI Packages**: ${uiPackagesCreated.map((u) => `packages/${u}`).join(', ') || 'None'}
- **Architecture**: ${config.architecture.pattern} (${config.architecture.folderOrganization}, ${config.architecture.fileNaming})
- **Test Coverage**: ${coverage.enabled ? `Enabled (${coverage.threshold}% threshold)` : 'Disabled'}
- **AI Agents**: ${config.stack.agents.join(', ')}

## Initialized Workspaces

### Apps
${appsDoc || '- None'}

### Packages
${pkgsDoc || '- None'}
`;
  await fs.writeFile(path.join(targetDir, 'README.md'), readme, 'utf-8');
  filesCreated.push('README.md');

  filesCreated.push(...(await scaffoldLocalValidation(targetDir)));
  await formatGeneratedFiles(targetDir, filesCreated);

  return { targetDir, filesCreated, uiPackagesCreated };
}
