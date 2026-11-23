import fs from 'node:fs/promises';
import path from 'node:path';
import type { BootstrapConfig, Framework } from '../../types/index.js';
import { getPinnedVersion } from '../catalog/index.js';
import { generateUniversalAIEcosystem } from './ai-ecosystem.generator.js';
import { generateMcpConfig } from './mcp.generator.js';
import { generateModule } from './module.generator.js';

export interface GenerationResult {
  targetDir: string;
  filesCreated: string[];
  uiPackagesCreated: ('ui-cli' | 'ui-web' | 'ui-mobile')[];
}

const CLI_FRAMEWORKS: Framework[] = ['ink'];
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
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
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
  const allFrameworks = new Set<Framework>([
    ...config.stack.frameworks,
    ...config.workspace.apps.map((a) => a.framework),
    ...config.workspace.packages.map((p) => p.framework),
  ]);

  const required: ('ui-cli' | 'ui-web' | 'ui-mobile')[] = [];

  if (CLI_FRAMEWORKS.some((f) => allFrameworks.has(f))) {
    required.push('ui-cli');
  }
  if (WEB_FRAMEWORKS.some((f) => allFrameworks.has(f))) {
    required.push('ui-web');
  }
  if (MOBILE_FRAMEWORKS.some((f) => allFrameworks.has(f))) {
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
      type: 'module',
      main: 'src/index.ts',
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
    created.push('packages/ui-cli/package.json', 'packages/ui-cli/src/index.ts');
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
      type: 'module',
      main: 'src/index.ts',
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
      path.join(pkgRoot, 'src', 'index.ts'),
      `// Shared Web UI Components (ShadCN + Aceternity UI) for ${config.project.name}\nexport const UI_WEB_KIND = 'ui-web' as const;\n`,
      'utf-8',
    );
    created.push('packages/ui-web/package.json', 'packages/ui-web/src/index.ts');
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
      type: 'module',
      main: 'src/index.ts',
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
      path.join(pkgRoot, 'src', 'index.ts'),
      `// Shared Mobile UI Components (React Native / Lynx) for ${config.project.name}\nexport const UI_MOBILE_KIND = 'ui-mobile' as const;\n`,
      'utf-8',
    );
    created.push('packages/ui-mobile/package.json', 'packages/ui-mobile/src/index.ts');
  }

  return created;
}

export async function generateProject(
  targetDir: string,
  config: BootstrapConfig,
): Promise<GenerationResult> {
  const filesCreated: string[] = [];
  await fs.mkdir(targetDir, { recursive: true });

  // 1. Persist bootstrap.config.json
  const configPath = path.join(targetDir, 'bootstrap.config.json');
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  filesCreated.push('bootstrap.config.json');

  // 2. CODEOWNERS
  if (config.project.codeowners) {
    const codeownersPath = path.join(targetDir, 'CODEOWNERS');
    await fs.writeFile(codeownersPath, `* @${config.project.author}\n`, 'utf-8');
    filesCreated.push('CODEOWNERS');
  }

  const coverage = config.testing?.coverage ?? { enabled: true, threshold: 75 };

  // 3. Root package.json + tsconfig.json (if TypeScript is selected)
  if (config.stack.languages.includes('typescript')) {
    const devDeps: Record<string, string> = {
      typescript: getPinnedVersion('typescript'),
    };
    if (config.stack.monorepo) {
      devDeps.nx = getPinnedVersion('nx');
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
    if (config.stack.frameworks.includes('eslint')) {
      devDeps.eslint = getPinnedVersion('eslint');
    }
    if (config.stack.frameworks.includes('biome')) {
      devDeps['@biomejs/biome'] = getPinnedVersion('@biomejs/biome');
    }
    if (config.stack.frameworks.includes('oxc')) {
      devDeps.oxlint = getPinnedVersion('oxlint');
    }
    if (
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

    const pkgJson: Record<string, unknown> = {
      name: config.project.name,
      version: '0.1.0',
      private: config.stack.monorepo,
      description: config.project.description,
      author: config.project.author,
      ...(config.stack.packageManager === 'yarn' ? { packageManager: 'yarn@4.19.0' } : {}),
      ...(config.stack.monorepo && config.stack.packageManager !== 'pnpm'
        ? { workspaces: ['apps/*', 'packages/*'] }
        : {}),
      scripts: {
        build: config.stack.monorepo ? 'nx run-many -t build' : 'tsc',
        test: config.stack.frameworks.includes('vitest')
          ? 'vitest run'
          : config.stack.frameworks.includes('jest')
            ? 'jest'
            : 'echo "No test runner configured"',
        ...(coverage.enabled && config.stack.frameworks.includes('vitest')
          ? { 'test:coverage': 'vitest run --coverage' }
          : coverage.enabled && config.stack.frameworks.includes('jest')
            ? { 'test:coverage': 'jest --coverage' }
            : {}),
        typecheck: 'tsc --noEmit',
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
      await fs.writeFile(
        path.join(targetDir, '.yarnrc.yml'),
        'nodeLinker: node-modules\nenableTelemetry: false\n',
        'utf-8',
      );
      filesCreated.push('.yarnrc.yml');
    }

    if (config.stack.monorepo && config.stack.packageManager === 'pnpm') {
      await fs.writeFile(
        path.join(targetDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "apps/*"\n  - "packages/*"\n',
        'utf-8',
      );
      filesCreated.push('pnpm-workspace.yaml');
    }

    if (config.stack.monorepo) {
      const nxJson = {
        $schema: './node_modules/nx/schemas/nx-schema.json',
        defaultBase: 'main',
      };
      await fs.writeFile(
        path.join(targetDir, 'nx.json'),
        `${JSON.stringify(nxJson, null, 2)}\n`,
        'utf-8',
      );
      filesCreated.push('nx.json');
    }
  }

  // 4. Security & Quality Configs
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
      path.join(targetDir, '.prettierrc'),
      `${JSON.stringify({ semi: true, singleQuote: true, trailingComma: 'all', printWidth: 100 }, null, 2)}\n`,
      'utf-8',
    );
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
    filesCreated.push('.prettierrc', 'commitlint.config.mjs', '.husky/commit-msg');
  }

  if (config.stack.frameworks.includes('aceternity-ui')) {
    await fs.writeFile(
      path.join(targetDir, '.env.example'),
      `ACETERNITY_PRO_API_KEY=your_key_here\nACETERNITY_PRO_LICENSE_KEY=your_license_here\nNEXT_PUBLIC_ACETERNITY_PRO_ENABLED=true\n`,
      'utf-8',
    );
    filesCreated.push('.env.example');
  }

  // 5. Makefile for non-JS projects
  const hasNonJs = config.stack.languages.some((l) => l !== 'typescript');
  if (config.stack.useMakefiles && hasNonJs) {
    const makeLines = [
      '# Planet Express Polyglot Makefile',
      '.PHONY: build test lint',
      '',
      'build:',
      config.stack.languages.includes('golang') ? '\tgo build ./...' : '',
      config.stack.languages.includes('rust') ? '\tcargo build' : '',
      config.stack.languages.includes('solidity') ? '\tforge build' : '',
      '',
      'test:',
      config.stack.languages.includes('golang') ? '\tgo test ./...' : '',
      config.stack.languages.includes('rust') ? '\tcargo test' : '',
      config.stack.languages.includes('solidity') ? '\tforge test' : '',
      '',
    ].filter((l) => l !== '');

    await fs.writeFile(path.join(targetDir, 'Makefile'), `${makeLines.join('\n')}\n`, 'utf-8');
    filesCreated.push('Makefile');
  }

  // 6. Mandatory Separated UI Packages (ui-cli, ui-web, ui-mobile)
  const uiPackagesCreated = resolveRequiredUiPackages(config);
  for (const uiKind of uiPackagesCreated) {
    const uiFiles = await scaffoldSeparatedUiPackage(targetDir, uiKind, config);
    filesCreated.push(...uiFiles);
  }

  // 7. Workspace apps & packages
  for (const app of config.workspace.apps) {
    const appDir = path.join(targetDir, 'apps', app.name);
    await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(appDir, 'README.md'),
      `# ${app.name}\n\nLanguage: ${app.language} | Framework: ${app.framework}\n`,
      'utf-8',
    );
    filesCreated.push(`apps/${app.name}/README.md`);
  }

  for (const pkg of config.workspace.packages) {
    if (pkg.name === 'ui-cli' || pkg.name === 'ui-web' || pkg.name === 'ui-mobile') {
      continue;
    }
    const pkgDir = path.join(targetDir, 'packages', pkg.name);
    await fs.mkdir(path.join(pkgDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(pkgDir, 'README.md'),
      `# ${pkg.name}\n\nLanguage: ${pkg.language} | Framework: ${pkg.framework}\n`,
      'utf-8',
    );
    filesCreated.push(`packages/${pkg.name}/README.md`);
  }

  // 8. Example module following architecture & naming conventions
  if (config.architecture.exampleModule) {
    const primaryLang = config.stack.languages[0] ?? 'typescript';
    const exampleFiles = await generateModule(targetDir, 'planet-delivery', config, primaryLang);
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
    `# Changelog\n\nAll notable changes to **${config.project.name}** are documented here.\n\n## [0.1.0] - ${new Date().toISOString().slice(0, 10)}\n\n### Added\n- Initial scaffold bootstrapped with Planet Express (\`little.bootstrapper\`).\n`,
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
  await fs.writeFile(
    path.join(workflowsDir, 'pr-validation.yml'),
    `name: PR Validation & Pattern Gate\non:\n  pull_request:\n    branches: [main]\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n      - run: npx little-bootstrapper validate\n${coverageCiStep}`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(workflowsDir, 'release.yml'),
    `name: Tag Release\non:\n  push:\n    tags:\n      - 'v*.*.*'\njobs:\n  release:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: softprops/action-gh-release@v2\n        with:\n          generate_release_notes: true\n`,
    'utf-8',
  );
  filesCreated.push('.github/workflows/pr-validation.yml', '.github/workflows/release.yml');

  // 11. README.md
  const readme = `# ${config.project.name}

> ${config.project.description}

Bootstrapped with **little.bootstrapper** (Planet Express Universal AI Agent Initializer).

## Stack

- **Languages**: ${config.stack.languages.join(', ')}
- **Package Manager**: ${config.stack.packageManager}
- **Frameworks**: ${config.stack.frameworks.join(', ') || 'None'}
- **Separated UI Packages**: ${uiPackagesCreated.map((u) => `packages/${u}`).join(', ') || 'None'}
- **Architecture**: ${config.architecture.pattern} (${config.architecture.folderOrganization}, ${config.architecture.fileNaming})
- **Test Coverage**: ${coverage.enabled ? `Enabled (${coverage.threshold}% threshold)` : 'Disabled'}
- **AI Agents**: ${config.stack.agents.join(', ')}
`;
  await fs.writeFile(path.join(targetDir, 'README.md'), readme, 'utf-8');
  filesCreated.push('README.md');

  return { targetDir, filesCreated, uiPackagesCreated };
}
