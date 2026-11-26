import { scaffoldHexagonalBackend } from './backend-layout.generator.js';
import { scaffoldWebHealthPanel } from './health-panel.generator.js';
import { scaffoldViteEntry } from './vite-app.generator.js';
import { rustPackageName, scaffoldRustContracts } from './rust-contracts.generator.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  BootstrapConfig,
  Framework,
  RootLinter,
  UiPackageKind,
  WorkspaceEntry,
  WorkspaceKind,
} from '../../types/index.js';
import { getPinnedVersion } from '../catalog/index.js';
import {
  GO_HEALTH_RESPONSE,
  renderGoBackend,
  renderRustBackend,
} from './native-backend.generator.js';
import { nativeTargets } from './native.generator.js';

const BACKEND_FRAMEWORKS = new Set<Framework>([
  'hono',
  'express',
  'fastify',
  'koa',
  'elysia',
  'fiber',
  'gin',
  'chi',
  'echo',
  'axum',
  'hyper',
]);

const WEB_FRAMEWORKS = new Set<Framework>(['nextjs', 'react-vite', 'nuxtjs', 'tauri']);
const MOBILE_FRAMEWORKS = new Set<Framework>(['react-native', 'lynx']);

export function resolveRootLinter(config: BootstrapConfig): RootLinter {
  if (config.stack.linter) return config.stack.linter;
  if (config.stack.frameworks.includes('biome')) return 'biome';
  if (config.stack.frameworks.includes('oxc')) return 'oxlint';
  if (config.stack.frameworks.includes('eslint')) return 'eslint';
  return 'eslint';
}

export function isPrettierEnabled(config: BootstrapConfig): boolean {
  return config.stack.prettier !== false;
}

export function inferWorkspaceKind(
  entry: WorkspaceEntry,
  bucket: 'app' | 'package',
): WorkspaceKind {
  if (entry.kind) return entry.kind;
  if (entry.name === 'contracts') return 'contracts';
  if (BACKEND_FRAMEWORKS.has(entry.framework)) return 'backend';
  if (WEB_FRAMEWORKS.has(entry.framework)) return 'web';
  if (MOBILE_FRAMEWORKS.has(entry.framework)) return 'mobile';
  if (entry.framework === 'ink') return 'cli';
  return bucket === 'app' ? 'backend' : 'library';
}

function getWorkspaceDepVersion(pm: BootstrapConfig['stack']['packageManager']): string {
  return pm === 'npm' ? '0.1.0' : 'workspace:*';
}

function buildProjectJson(
  scope: string,
  name: string,
  kind: 'application' | 'library',
  isTs: boolean | WorkspaceEntry,
): Record<string, unknown> {
  const native = typeof isTs === 'object' && isTs.language !== 'typescript';
  const projectName = native
    ? isTs.language === 'rust'
      ? rustPackageName(scope.slice(1), name)
      : name
    : `${scope}/${name}`;
  const relBase = `${kind === 'application' ? 'apps' : 'packages'}/${name}`;
  return {
    name: projectName,
    projectType: kind,
    sourceRoot: native ? relBase : `${relBase}/src`,
    targets:
      isTs === true || (typeof isTs === 'object' && !native)
        ? {
            build: {
              executor: 'nx:run-commands',
              options: {
                command: 'npm run build',
                cwd: `${kind === 'application' ? 'apps' : 'packages'}/${name}`,
              },
            },
            typecheck: {
              executor: 'nx:run-commands',
              options: {
                command: 'npm run typecheck',
                cwd: `${kind === 'application' ? 'apps' : 'packages'}/${name}`,
              },
            },
            test: {
              executor: 'nx:run-commands',
              options: {
                command: 'npm test',
                cwd: `${kind === 'application' ? 'apps' : 'packages'}/${name}`,
              },
            },
          }
        : typeof isTs === 'object'
          ? nativeTargets(
              `${kind === 'application' ? 'apps' : 'packages'}/${name}`,
              isTs,
              kind === 'application' && isTs.kind !== 'library',
            )
          : {},
  };
}

export async function scaffoldRootTooling(
  targetDir: string,
  config: BootstrapConfig,
): Promise<string[]> {
  const created: string[] = [];
  const hasTs = config.stack.languages.includes('typescript');
  const linter = resolveRootLinter(config);
  const prettier = isPrettierEnabled(config);

  if (hasTs) {
    const tsconfigBase = {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        sourceMap: true,
        resolveJsonModule: true,
      },
    };
    await fs.writeFile(
      path.join(targetDir, 'tsconfig.base.json'),
      `${JSON.stringify(tsconfigBase, null, 2)}\n`,
      'utf-8',
    );
    created.push('tsconfig.base.json');
  }

  // Prettier configured at root by default
  if (prettier) {
    await fs.writeFile(
      path.join(targetDir, '.prettierrc'),
      `${JSON.stringify({ semi: true, singleQuote: true, trailingComma: 'all', printWidth: 100 }, null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(targetDir, '.prettierignore'),
      `node_modules\ndist\n.next\n.nuxt\n.output\ncoverage\n.nx\ntarget\n.yarn\n*.lock\npnpm-lock.yaml\npackage-lock.json\nartifacts\ncache\nout\n`,
      'utf-8',
    );
    created.push('.prettierrc', '.prettierignore');
  }

  // Root-only Linter configuration (never duplicated in apps/* or packages/*)
  if (hasTs && linter === 'eslint') {
    await fs.writeFile(
      path.join(targetDir, 'eslint.config.mjs'),
      `// Root-only ESLint flat configuration for ${config.project.name}
import tsParser from '@typescript-eslint/parser';
export default [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/.nuxt/**', '**/.output/**', '**/target/**', '**/artifacts/**', '**/cache/**', '**/out/**', '**/coverage/**', '**/node_modules/**', '.yarn/**', '**/next-env.d.ts'],
  },
  {
    files: ['apps/**/*.{ts,tsx,js,mjs}', 'packages/**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'no-debugger': 'error',
    },
  },
];
`,
      'utf-8',
    );
    created.push('eslint.config.mjs');
  } else if (hasTs && linter === 'biome') {
    const biomeCfg = {
      $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
      vcs: { enabled: true, clientKind: 'git', useIgnoreFile: true },
      linter: { enabled: true, rules: { recommended: true } },
      formatter: { enabled: !prettier },
    };
    await fs.writeFile(
      path.join(targetDir, 'biome.json'),
      `${JSON.stringify(biomeCfg, null, 2)}\n`,
      'utf-8',
    );
    created.push('biome.json');
  } else if (hasTs && linter === 'oxlint') {
    const oxCfg = {
      categories: { correctness: 'error', suspicious: 'warn' },
      ignorePatterns: ['dist', '.next', 'coverage', 'node_modules'],
    };
    await fs.writeFile(
      path.join(targetDir, '.oxlintrc.json'),
      `${JSON.stringify(oxCfg, null, 2)}\n`,
      'utf-8',
    );
    created.push('.oxlintrc.json');
  }

  return created;
}

async function scaffoldContractsPackage(
  pkgDir: string,
  relBase: string,
  pkg: WorkspaceEntry,
  config: BootstrapConfig,
): Promise<string[]> {
  const created: string[] = [];
  const scope = `@${config.project.name}`;
  await fs.mkdir(path.join(pkgDir, 'src', '__tests__'), { recursive: true });

  const pkgJson = {
    name: `${scope}/${pkg.name}`,
    version: '0.1.0',
    private: true,
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
    },
    scripts: {
      build: 'tsc -p tsconfig.json',
      typecheck: 'tsc --noEmit -p tsconfig.json',
      test: 'vitest run',
    },
    dependencies: {
      zod: getPinnedVersion('zod'),
    },
    devDependencies: {
      typescript: getPinnedVersion('typescript'),
      vitest: getPinnedVersion('vitest'),
    },
  };

  await fs.writeFile(
    path.join(pkgDir, 'package.json'),
    `${JSON.stringify(pkgJson, null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(pkgDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: { outDir: 'dist', rootDir: 'src' },
        include: ['src/**/*'],
        exclude: ['src/**/__tests__/**'],
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(pkgDir, 'project.json'),
    `${JSON.stringify(buildProjectJson(scope, pkg.name, 'library', true), null, 2)}\n`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(pkgDir, 'src', 'health.contract.ts'),
    `import { z } from 'zod';

export const HEALTH_ENDPOINT_PATH = '/health' as const;

export const HealthStatusSchema = z.enum(['ok', 'degraded']);

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
  uptimeSeconds: z.number().nonnegative(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export function createHealthPayload(service: string, version = '0.1.0'): HealthResponse {
  return HealthResponseSchema.parse({
    status: 'ok',
    service,
    version,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.max(0, Math.round(process.uptime())),
  });
}
`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(pkgDir, 'src', 'index.ts'),
    `export {\n  HEALTH_ENDPOINT_PATH,\n  HealthStatusSchema,\n  HealthResponseSchema,\n  createHealthPayload,\n  type HealthStatus,\n  type HealthResponse,\n} from './health.contract.js';\n`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(pkgDir, 'src', '__tests__', 'health.contract.test.ts'),
    `import { describe, it, expect } from 'vitest';
import {
  HEALTH_ENDPOINT_PATH,
  HealthResponseSchema,
  createHealthPayload,
} from '../index.js';

describe('${scope}/${pkg.name} sample contract', () => {
  it('creates and validates a compliant health response payload', () => {
    const payload = createHealthPayload('${config.project.name}-api', '0.1.0');
    const parsed = HealthResponseSchema.parse(payload);
    expect(HEALTH_ENDPOINT_PATH).toBe('/health');
    expect(parsed.status).toBe('ok');
    expect(parsed.service).toBe('${config.project.name}-api');
  });
});
`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(pkgDir, 'README.md'),
    `# ${scope}/${pkg.name}\n\nShared Zod contracts & TypeScript types (including \`HealthResponseSchema\` for \`GET /health\`).\n`,
    'utf-8',
  );

  created.push(
    `${relBase}/package.json`,
    `${relBase}/tsconfig.json`,
    `${relBase}/project.json`,
    `${relBase}/src/health.contract.ts`,
    `${relBase}/src/index.ts`,
    `${relBase}/src/__tests__/health.contract.test.ts`,
    `${relBase}/README.md`,
  );
  return created;
}

function renderTsBackendApp(
  framework: Framework,
  serviceName: string,
  contractsImport: string | null,
): {
  deps: Record<string, string>;
  devDeps: Record<string, string>;
  appCode: string;
  entryCode: string;
} {
  const payloadImport = contractsImport
    ? `import { HEALTH_ENDPOINT_PATH, createHealthPayload, type HealthResponse } from '${contractsImport}';`
    : `export const HEALTH_ENDPOINT_PATH = '/health' as const;
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}
function createHealthPayload(service: string, version = '0.1.0'): HealthResponse {
  return {
    status: 'ok',
    service,
    version,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.max(0, Math.round(process.uptime())),
  };
}`;

  if (framework === 'express') {
    return {
      deps: { express: getPinnedVersion('express') },
      devDeps: { '@types/express': getPinnedVersion('@types/express') },
      appCode: `import express from 'express';
${payloadImport}

export function createApp() {
  const app = express();
  app.get(HEALTH_ENDPOINT_PATH, (_req, res) => {
    const payload: HealthResponse = createHealthPayload('${serviceName}');
    res.status(200).json(payload);
  });
  return app;
}

export function getHealthResponse(): HealthResponse {
  return createHealthPayload('${serviceName}');
}
`,
      entryCode: `import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();
app.listen(port, () => {
  console.info(\`[${serviceName}] listening on http://localhost:\${port}/health\`);
});
`,
    };
  }

  if (framework === 'fastify') {
    return {
      deps: { fastify: getPinnedVersion('fastify') },
      devDeps: {},
      appCode: `import Fastify from 'fastify';
${payloadImport}

export function createApp() {
  const app = Fastify();
  app.get(HEALTH_ENDPOINT_PATH, async (): Promise<HealthResponse> =>
    createHealthPayload('${serviceName}'),
  );
  return app;
}

export function getHealthResponse(): HealthResponse {
  return createHealthPayload('${serviceName}');
}
`,
      entryCode: `import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();
void app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.info(\`[${serviceName}] listening on http://localhost:\${port}/health\`);
});
`,
    };
  }

  if (framework === 'elysia') {
    return {
      deps: { elysia: getPinnedVersion('elysia') },
      devDeps: {},
      appCode: `import { Elysia } from 'elysia';
${payloadImport}

export function createApp() {
  return new Elysia().get(HEALTH_ENDPOINT_PATH, (): HealthResponse =>
    createHealthPayload('${serviceName}'),
  );
}

export function getHealthResponse(): HealthResponse {
  return createHealthPayload('${serviceName}');
}
`,
      entryCode: `import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port);
console.info(\`[${serviceName}] listening on http://localhost:\${port}/health\`);
`,
    };
  }

  if (framework === 'koa') {
    return {
      deps: { koa: getPinnedVersion('koa') },
      devDeps: { '@types/koa': getPinnedVersion('@types/koa') },
      appCode: `import Koa from 'koa';
${payloadImport}

export function createApp() {
  const app = new Koa();
  app.use(async (ctx) => {
    if (ctx.path === HEALTH_ENDPOINT_PATH) {
      ctx.status = 200;
      ctx.body = createHealthPayload('${serviceName}');
    }
  });
  return app;
}

export function getHealthResponse(): HealthResponse {
  return createHealthPayload('${serviceName}');
}
`,
      entryCode: `import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, () => {
  console.info(\`[${serviceName}] listening on http://localhost:\${port}/health\`);
});
`,
    };
  }

  // Default TS backend: Hono
  return {
    deps: {
      hono: getPinnedVersion('hono'),
      '@hono/node-server': getPinnedVersion('@hono/node-server'),
    },
    devDeps: {},
    appCode: `import { Hono } from 'hono';
${payloadImport}

export function createApp() {
  const app = new Hono();
  app.get(HEALTH_ENDPOINT_PATH, (c) => {
    const payload: HealthResponse = createHealthPayload('${serviceName}');
    return c.json(payload, 200);
  });
  return app;
}

export function getHealthResponse(): HealthResponse {
  return createHealthPayload('${serviceName}');
}
`,
    entryCode: `import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
serve({ fetch: createApp().fetch, port }, () => {
  console.info(\`[${serviceName}] listening on http://localhost:\${port}/health\`);
});
`,
  };
}

function renderBackendHttpTest(framework: Framework): string {
  if (framework === 'express' || framework === 'koa')
    return `
  it('serves health over HTTP and returns 404 for missing routes', async () => {
    const server = createApp().listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing server address');
      const url = \`http://127.0.0.1:\${address.port}\`;
      expect((await fetch(\`\${url}/health\`)).status).toBe(200);
      expect((await fetch(\`\${url}/missing\`)).status).toBe(404);
    } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
  });`;
  if (framework === 'fastify')
    return `
  it('serves health and missing routes', async () => {
    const app = createApp();
    try { expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200); expect((await app.inject({ method: 'GET', url: '/missing' })).statusCode).toBe(404); }
    finally { await app.close(); }
  });`;
  return `
  it('serves health and missing routes', async () => {
    const app = createApp();
    const response = await app.${framework === 'elysia' ? 'handle' : 'request'}(new Request('http://localhost/health'));
    expect(response.status).toBe(200);
    expect((await response.json() as { status: string }).status).toBe('ok');
    expect((await app.${framework === 'elysia' ? 'handle' : 'request'}(new Request('http://localhost/missing'))).status).toBe(404);
  });`;
}

async function scaffoldBackendApp(
  appDir: string,
  relBase: string,
  app: WorkspaceEntry,
  config: BootstrapConfig,
  contractsPkgName: string | null,
): Promise<string[]> {
  const created: string[] = [];
  const scope = `@${config.project.name}`;
  const serviceName = `${config.project.name}-${app.name}`;

  if (app.language === 'golang' || app.language === 'rust') {
    const go = app.language === 'golang';
    await fs.mkdir(path.join(appDir, 'src'), { recursive: true });
    const goContracts = config.workspace.packages.find(
      (pkg) => pkg.language === 'golang' && (pkg.kind === 'contracts' || pkg.name === 'contracts'),
    );
    const goBackend = go
      ? renderGoBackend(
          app.framework,
          serviceName,
          `github.com/${config.project.author}/${config.project.name}/${relBase}`,
          goContracts
            ? {
                module: `github.com/${config.project.author}/${config.project.name}/packages/${goContracts.name}`,
                directory: goContracts.name,
              }
            : undefined,
        )
      : null;
    const sharedRust = config.workspace.packages.find(
      (pkg) => pkg.language === 'rust' && (pkg.kind === 'contracts' || pkg.name === 'contracts'),
    );
    const backend =
      goBackend ??
      renderRustBackend(
        app.framework,
        serviceName,
        sharedRust
          ? {
              name: rustPackageName(config.project.name, sharedRust.name),
              directory: sharedRust.name,
            }
          : undefined,
      );
    const manifest = go ? 'go.mod' : 'Cargo.toml';
    const source = go ? 'main.go' : 'src/main.rs';
    await fs.writeFile(path.join(appDir, manifest), backend.manifest);
    await fs.writeFile(path.join(appDir, source), backend.source);
    if (goBackend) {
      await fs.writeFile(path.join(appDir, 'main_test.go'), goBackend.test);
      if (config.architecture.pattern !== 'hexagonal') created.push(`${relBase}/main_test.go`);
    }
    if (config.architecture.pattern === 'hexagonal') {
      const layoutFiles = await scaffoldHexagonalBackend(
        appDir,
        go ? 'golang' : 'rust',
        `github.com/${config.project.author}/${config.project.name}/${relBase}`,
        backend.source,
        goBackend?.test,
      );
      created.push(...layoutFiles.map((file) => `${relBase}/${file}`));
    }
    await fs.writeFile(
      path.join(appDir, 'project.json'),
      `${JSON.stringify(buildProjectJson(scope, app.name, 'application', app), null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(appDir, 'README.md'),
      `# ${app.name}\n\n${app.language} (${app.framework}) HTTP service exposing GET /health. Set PORT to override 4000. Run via Nx start/dev/build/test targets.\n`,
    );
    return [
      ...created,
      `${relBase}/${manifest}`,
      `${relBase}/${source}`,
      `${relBase}/project.json`,
      `${relBase}/README.md`,
    ];
  }

  await fs.mkdir(path.join(appDir, 'src', '__tests__'), { recursive: true });
  const backend = renderTsBackendApp(app.framework, serviceName, contractsPkgName);
  await fs.writeFile(
    path.join(appDir, 'vitest.config.ts'),
    `import base from '../../vitest.config.js';
// Server startup is verified by the generated-server E2E suite; route behavior is covered here.
export default { ...base, test: { ...base.test, coverage: { ...base.test?.coverage, exclude: [...(base.test?.coverage?.exclude ?? []), 'src/index.ts'] } } };\n`,
  );
  created.push(`${relBase}/vitest.config.ts`);
  const wsVer = getWorkspaceDepVersion(config.stack.packageManager);

  const pkgJson = {
    name: `${scope}/${app.name}`,
    version: '0.1.0',
    private: true,
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      dev: app.framework === 'elysia' ? 'bun --watch src/index.ts' : 'tsx watch src/index.ts',
      build: 'tsc -p tsconfig.json',
      start: app.framework === 'elysia' ? 'bun dist/index.js' : 'node dist/index.js',
      typecheck: 'tsc --noEmit -p tsconfig.json',
      test: 'vitest run',
    },
    dependencies: {
      ...(contractsPkgName ? { [contractsPkgName]: wsVer } : {}),
      ...backend.deps,
    },
    devDependencies: {
      '@types/node': getPinnedVersion('@types/node'),
      tsx: getPinnedVersion('tsx'),
      typescript: getPinnedVersion('typescript'),
      vitest: getPinnedVersion('vitest'),
      ...backend.devDeps,
    },
  };

  await fs.writeFile(
    path.join(appDir, 'package.json'),
    `${JSON.stringify(pkgJson, null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: { outDir: 'dist', rootDir: 'src' },
        include: ['src/**/*'],
        exclude: ['src/**/__tests__/**'],
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'project.json'),
    `${JSON.stringify(buildProjectJson(scope, app.name, 'application', app), null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(path.join(appDir, 'src', 'app.ts'), backend.appCode, 'utf-8');
  await fs.writeFile(path.join(appDir, 'src', 'index.ts'), backend.entryCode, 'utf-8');
  await fs.writeFile(
    path.join(appDir, 'src', '__tests__', 'health.test.ts'),
    `import { describe, it, expect } from 'vitest';
import { createApp, getHealthResponse } from '../app.js';

describe('${serviceName} GET /health endpoint', () => {
  it('returns an ok health response matching the shared contract', () => {
    const res = getHealthResponse();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('${serviceName}');
    expect(res.version).toBe('0.1.0');
  });
${renderBackendHttpTest(app.framework)}
});
`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'README.md'),
    `# ${scope}/${app.name}\n\nBackend API (${app.framework}) exposing \`GET /health\`.\n`,
    'utf-8',
  );

  created.push(
    `${relBase}/package.json`,
    `${relBase}/tsconfig.json`,
    `${relBase}/project.json`,
    `${relBase}/src/app.ts`,
    `${relBase}/src/index.ts`,
    `${relBase}/src/__tests__/health.test.ts`,
    `${relBase}/README.md`,
  );
  return created;
}

async function scaffoldWebSampleApp(
  appDir: string,
  relBase: string,
  app: WorkspaceEntry,
  config: BootstrapConfig,
  contractsPkgName: string | null,
  hasUiWeb: boolean,
): Promise<string[]> {
  const created: string[] = [];
  const scope = `@${config.project.name}`;
  const wsVer = getWorkspaceDepVersion(config.stack.packageManager);

  if (app.framework === 'nextjs') {
    await fs.mkdir(path.join(appDir, 'src', 'app'), { recursive: true });
    await fs.mkdir(path.join(appDir, 'src', 'components'), { recursive: true });
    await fs.mkdir(path.join(appDir, 'src', '__tests__'), { recursive: true });

    const pkgJson = {
      name: `${scope}/${app.name}`,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        typecheck: 'tsc --noEmit -p tsconfig.json',
        test: 'vitest run',
      },
      dependencies: {
        ...(contractsPkgName ? { [contractsPkgName]: wsVer } : {}),
        ...(hasUiWeb ? { [`${scope}/ui-web`]: wsVer } : {}),
        next: getPinnedVersion('next'),
        react: getPinnedVersion('react'),
        'react-dom': getPinnedVersion('react-dom'),
      },
      devDependencies: {
        'react-test-renderer': getPinnedVersion('react-test-renderer'),
        '@types/react-test-renderer': getPinnedVersion('@types/react-test-renderer'),
        '@types/node': getPinnedVersion('@types/node'),
        '@types/react': getPinnedVersion('@types/react'),
        '@types/react-dom': getPinnedVersion('@types/react-dom'),
        typescript: getPinnedVersion('typescript'),
        vitest: getPinnedVersion('vitest'),
      },
    };

    await fs.writeFile(
      path.join(appDir, 'package.json'),
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(appDir, 'next.config.ts'),
      `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const api = (process.env.API_URL ?? 'http://127.0.0.1:4000').replace(/\\/$/, '');
    return [{ source: '/health', destination: \`\${api}/health\` }];
  },
  transpilePackages: [${[contractsPkgName, hasUiWeb ? `${scope}/ui-web` : null]
    .filter(Boolean)
    .map((p) => `'${p}'`)
    .join(', ')}],
};

export default nextConfig;
`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(appDir, 'tsconfig.json'),
      `${JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            jsx: 'preserve',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            noEmit: true,
          },
          include: ['src/**/*', 'next.config.ts'],
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(appDir, 'project.json'),
      `${JSON.stringify(buildProjectJson(scope, app.name, 'application', app), null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(appDir, 'src', 'app', 'layout.tsx'),
      `import type { Metadata } from 'next';
import type React from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '${config.project.name} — Web Sample App',
  description: ${JSON.stringify(config.project.description)},
};

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem' }}>
        {children}
      </body>
    </html>
  );
}
`,
      'utf-8',
    );

    await fs.writeFile(
      path.join(appDir, 'src/index.ts'),
      `export const WEB_APP_INFO = { project: '${config.project.name}', framework: 'nextjs', healthEndpoint: '/health', architecture: '${config.architecture.pattern}' } as const;\nexport const APP_CONFIG_SUMMARY = WEB_APP_INFO;\n`,
    );
    created.push(
      ...(await scaffoldWebHealthPanel(appDir, contractsPkgName, true)).map(
        (file) => `${relBase}/${file}`,
      ),
    );
    await fs.writeFile(
      path.join(appDir, 'vitest.config.ts'),
      "export { default } from '../../vitest.config.js';\n",
    );
    await fs.writeFile(
      path.join(appDir, 'src/app/page.tsx'),
      `import React from 'react';\nimport { App } from '../app';\nexport default function HomePage() { return <App />; }\n`,
    );
    await fs.writeFile(
      path.join(appDir, 'src/__tests__/page.test.ts'),
      `import React from 'react';\nimport { renderToStaticMarkup } from 'react-dom/server';\nimport { describe, it, expect } from 'vitest';\nimport HomePage from '../app/page';\nimport RootLayout from '../app/layout';\nimport { APP_CONFIG_SUMMARY } from '../index.js';\ndescribe('homepage', () => { it('renders the project and health action', () => { expect(APP_CONFIG_SUMMARY.architecture).toBe('${config.architecture.pattern}'); const html = renderToStaticMarkup(React.createElement(RootLayout, null, React.createElement(HomePage))); expect(html).toContain('${config.project.name}'); expect(html).toContain('Check API health'); }); });\n`,
    );
    await fs.writeFile(
      path.join(appDir, 'README.md'),
      `# ${scope}/${app.name}\n\nNext.js Web Sample App wired to \`${contractsPkgName ?? 'local contracts'}\` and backend \`GET /health\`.\n`,
      'utf-8',
    );

    created.push(
      `${relBase}/package.json`,
      `${relBase}/next.config.ts`,
      `${relBase}/tsconfig.json`,
      `${relBase}/project.json`,
      `${relBase}/src/app/layout.tsx`,
      `${relBase}/src/app/page.tsx`,
      `${relBase}/src/index.ts`,
      `${relBase}/vitest.config.ts`,
      `${relBase}/src/__tests__/page.test.ts`,
      `${relBase}/README.md`,
    );
    return created;
  }

  // React Vite / Nuxt / Generic Web skeleton
  await fs.mkdir(path.join(appDir, 'src', '__tests__'), { recursive: true });
  const pkgJson = {
    name: `${scope}/${app.name}`,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: app.framework === 'nuxtjs' ? 'nuxt dev' : 'vite',
      build: app.framework === 'nuxtjs' ? 'nuxt build' : 'vite build',
      typecheck: app.framework === 'nuxtjs' ? 'nuxt typecheck' : 'tsc --noEmit -p tsconfig.json',
      test: 'vitest run',
      start: app.framework === 'nuxtjs' ? 'nuxt start' : 'vite preview',
    },
    dependencies: {
      ...(contractsPkgName ? { [contractsPkgName]: wsVer } : {}),
      ...(app.framework === 'nuxtjs'
        ? { nuxt: getPinnedVersion('nuxt'), vue: getPinnedVersion('vue') }
        : {
            react: getPinnedVersion('react'),
            'react-dom': getPinnedVersion('react-dom'),
          }),
    },
    devDependencies: {
      ...(app.framework !== 'nuxtjs'
        ? { vite: getPinnedVersion('vite') }
        : { 'vue-tsc': getPinnedVersion('vue-tsc') }),
      ...(app.framework === 'react-vite'
        ? {
            'react-test-renderer': getPinnedVersion('react-test-renderer'),
            '@types/react-test-renderer': getPinnedVersion('@types/react-test-renderer'),
          }
        : {}),
      '@types/react': getPinnedVersion('@types/react'),
      '@types/react-dom': getPinnedVersion('@types/react-dom'),
      typescript: getPinnedVersion('typescript'),
      vitest: getPinnedVersion('vitest'),
    },
  };

  await fs.writeFile(
    path.join(appDir, 'package.json'),
    `${JSON.stringify(pkgJson, null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          jsx: 'react-jsx',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          noEmit: true,
        },
        include: ['src/**/*'],
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'project.json'),
    `${JSON.stringify(buildProjectJson(scope, app.name, 'application', app), null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'src', 'index.ts'),
    `export const WEB_APP_INFO = {\n  name: '${app.name}',\n  framework: '${app.framework}',\n  project: '${config.project.name}',\n  healthEndpoint: '/health',\n} as const;\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'src', '__tests__', 'app.test.ts'),
    `import { describe, it, expect } from 'vitest';\nimport { WEB_APP_INFO } from '../index.js';\n\ndescribe('${scope}/${app.name}', () => {\n  it('exports web app metadata', () => {\n    expect(WEB_APP_INFO.name).toBe('${app.name}');\n    expect(WEB_APP_INFO.healthEndpoint).toBe('/health');\n  });\n});\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(appDir, 'README.md'),
    `# ${scope}/${app.name}\n\nWeb Sample App (${app.framework}).\n`,
    'utf-8',
  );

  created.push(
    `${relBase}/package.json`,
    `${relBase}/tsconfig.json`,
    `${relBase}/project.json`,
    `${relBase}/src/index.ts`,
    `${relBase}/src/__tests__/app.test.ts`,
    `${relBase}/README.md`,
  );
  if (app.framework === 'react-vite') {
    created.push(
      ...(await scaffoldViteEntry(appDir, config.project.name, contractsPkgName)).map(
        (file) => `${relBase}/${file}`,
      ),
    );
  }
  if (app.framework === 'nuxtjs') {
    await fs.writeFile(
      path.join(appDir, 'nuxt.config.ts'),
      `export default defineNuxtConfig({ srcDir: 'src/', compatibilityDate: '2025-04-01', devtools: { enabled: false }, nitro: { routeRules: { '/health': { proxy: \`\${process.env.API_URL ?? 'http://127.0.0.1:4000'}/health\` } } } });\n`,
    );
    await fs.writeFile(
      path.join(appDir, 'tsconfig.json'),
      JSON.stringify({ extends: './.nuxt/tsconfig.json' }, null, 2),
    );
    await fs.writeFile(
      path.join(appDir, 'src/app.vue'),
      `<script setup lang="ts">
import { ref } from 'vue';
${contractsPkgName ? `import { HealthResponseSchema } from '${contractsPkgName}';` : ''}
const status = ref('Not connected');
async function checkHealth() {
  try {
    const response = await fetch('/health');
    if (!response.ok) throw new Error(\`API returned HTTP \${response.status}\`);
    const payload: unknown = await response.json();
    ${contractsPkgName ? `const parsed = HealthResponseSchema.parse(payload); status.value = \`\${parsed.service}: \${parsed.status}\`;` : `if (!payload || typeof payload !== 'object' || !('status' in payload) || typeof payload.status !== 'string') throw new Error('Invalid health response'); status.value = payload.status;`}
  } catch (error) { status.value = error instanceof Error ? error.message : 'Cannot reach API'; }
}
</script>
<template><main><h1>${config.project.name}</h1><output>{{ status }}</output><button type="button" @click="checkHealth">Check API health</button></main></template>
`,
    );
    created.push(`${relBase}/nuxt.config.ts`, `${relBase}/src/app.vue`);
  }
  return created;
}

async function scaffoldGenericWorkspace(
  dir: string,
  relBase: string,
  entry: WorkspaceEntry,
  bucket: 'app' | 'package',
  config: BootstrapConfig,
): Promise<string[]> {
  const created: string[] = [];
  const scope = `@${config.project.name}`;
  const projectType = bucket === 'app' ? 'application' : 'library';

  if (entry.language === 'solidity') {
    await fs.mkdir(path.join(dir, 'src'), { recursive: true });
    await fs.mkdir(path.join(dir, 'test'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'src', 'SampleContract.sol'),
      `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.28;\n\ncontract SampleContract {\n    string public constant SERVICE = "${config.project.name}";\n\n    function isHealthy() external pure returns (bool) {\n        return true;\n    }\n}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'project.json'),
      `${JSON.stringify(buildProjectJson(scope, entry.name, projectType, entry), null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'README.md'),
      `# ${entry.name}\n\nSolidity (${entry.framework}) workspace.\n`,
      'utf-8',
    );
    created.push(
      `${relBase}/src/SampleContract.sol`,
      `${relBase}/project.json`,
      `${relBase}/README.md`,
    );
    return created;
  }

  if (entry.language === 'golang') {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, 'go.mod'),
      `module github.com/${config.project.author}/${config.project.name}/${relBase}\n\ngo 1.23\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'lib.go'),
      `package ${entry.name.replace(/-/g, '_')}\n\nfunc Name() string {\n\treturn "${entry.name}"\n}\n${entry.kind === 'contracts' || entry.name === 'contracts' ? `\n${GO_HEALTH_RESPONSE}\n` : ''}`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'lib_test.go'),
      `package ${entry.name.replace(/-/g, '_')}\nimport "testing"\nfunc TestName(t *testing.T) { if Name() != "${entry.name}" { t.Fatal("unexpected package name") } }\n`,
    );
    await fs.writeFile(
      path.join(dir, 'project.json'),
      `${JSON.stringify(buildProjectJson(scope, entry.name, projectType, entry), null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'README.md'),
      `# ${entry.name}\n\nGo (${entry.framework}) package.\n`,
      'utf-8',
    );
    created.push(
      `${relBase}/go.mod`,
      `${relBase}/lib.go`,
      `${relBase}/lib_test.go`,
      `${relBase}/project.json`,
      `${relBase}/README.md`,
    );
    return created;
  }

  if (entry.language === 'rust') {
    await fs.mkdir(path.join(dir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'Cargo.toml'),
      `[package]\nname = "${rustPackageName(config.project.name, entry.name)}"\nversion = "0.1.0"\nedition = "2021"\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'src', 'lib.rs'),
      `pub fn workspace_name() -> &'static str {\n    "${entry.name}"\n}\n\n#[cfg(test)]\nmod tests { #[test] fn package_name() { assert_eq!(super::workspace_name(), "${entry.name}"); } }\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'project.json'),
      `${JSON.stringify(buildProjectJson(scope, entry.name, projectType, entry), null, 2)}\n`,
      'utf-8',
    );
    await fs.writeFile(
      path.join(dir, 'README.md'),
      `# ${entry.name}\n\nRust (${entry.framework}) package.\n`,
      'utf-8',
    );
    created.push(
      `${relBase}/Cargo.toml`,
      `${relBase}/src/lib.rs`,
      `${relBase}/project.json`,
      `${relBase}/README.md`,
    );
    return created;
  }

  await fs.mkdir(path.join(dir, 'src', '__tests__'), { recursive: true });
  const deps: Record<string, string> = {};
  if (entry.framework === 'ink') {
    deps.ink = getPinnedVersion('ink');
    deps['@inkjs/ui'] = getPinnedVersion('@inkjs/ui');
    deps.react = getPinnedVersion('react');
  }

  const pkgJson = {
    name: `${scope}/${entry.name}`,
    version: '0.1.0',
    private: true,
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc -p tsconfig.json',
      typecheck: 'tsc --noEmit -p tsconfig.json',
      test: 'vitest run',
      ...(entry.framework === 'ink' && bucket === 'app'
        ? { start: 'node dist/main.js', dev: 'tsx watch src/main.tsx' }
        : {}),
    },
    ...(Object.keys(deps).length > 0 ? { dependencies: deps } : {}),
    devDependencies: {
      ...(entry.framework === 'ink'
        ? {
            tsx: getPinnedVersion('tsx'),
            '@types/react': getPinnedVersion('@types/react'),
            '@types/node': getPinnedVersion('@types/node'),
          }
        : {}),
      typescript: getPinnedVersion('typescript'),
      vitest: getPinnedVersion('vitest'),
    },
  };

  await fs.writeFile(
    path.join(dir, 'package.json'),
    `${JSON.stringify(pkgJson, null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          outDir: 'dist',
          rootDir: 'src',
          ...(entry.framework === 'ink' ? { jsx: 'react-jsx' } : {}),
        },
        include: ['src/**/*'],
        exclude: ['src/**/__tests__/**'],
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'project.json'),
    `${JSON.stringify(buildProjectJson(scope, entry.name, projectType, true), null, 2)}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'src', 'index.ts'),
    `export const PACKAGE_INFO = {\n  name: '${scope}/${entry.name}',\n  framework: '${entry.framework}',\n  architecture: '${config.architecture.pattern}',\n} as const;\n\nexport function describePackage(): string {\n  return \`\${PACKAGE_INFO.name} (\${PACKAGE_INFO.framework})\`;\n}\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'src', '__tests__', `${entry.name}.test.ts`),
    `import { describe, it, expect } from 'vitest';\nimport { describePackage } from '../index.js';\n\ndescribe('${scope}/${entry.name}', () => {\n  it('exports initialized package metadata', () => {\n    expect(describePackage()).toContain('${entry.name}');\n  });\n});\n`,
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'README.md'),
    `# ${scope}/${entry.name}\n\nLanguage: ${entry.language} | Framework: ${entry.framework}\n`,
    'utf-8',
  );

  created.push(
    `${relBase}/package.json`,
    `${relBase}/tsconfig.json`,
    `${relBase}/project.json`,
    `${relBase}/src/index.ts`,
    `${relBase}/src/__tests__/${entry.name}.test.ts`,
    `${relBase}/README.md`,
  );
  if (entry.framework === 'ink' && bucket === 'app') {
    await fs.writeFile(
      path.join(dir, 'src/main.tsx'),
      `import React from 'react';\nimport { render, Text } from 'ink';\nimport { describePackage } from './index.js';\nconst app = render(<Text>{describePackage()} ready</Text>);\nconst exit = app.waitUntilExit();\napp.unmount();\nawait exit;\n`,
    );
    created.push(`${relBase}/src/main.tsx`);
  }
  return created;
}

export async function scaffoldWorkspacePackage(
  targetDir: string,
  pkg: WorkspaceEntry,
  config: BootstrapConfig,
): Promise<string[]> {
  const pkgDir = path.join(targetDir, 'packages', pkg.name);
  const relBase = `packages/${pkg.name}`;
  const kind = inferWorkspaceKind(pkg, 'package');

  if (pkg.language === 'rust' && (kind === 'contracts' || pkg.name === 'contracts')) {
    const bridge =
      config.stack.frameworks.includes('tauri') && config.stack.languages.includes('typescript');
    const created = bridge ? await scaffoldContractsPackage(pkgDir, relBase, pkg, config) : [];
    await scaffoldRustContracts(pkgDir, rustPackageName(config.project.name, pkg.name));
    const project = buildProjectJson(`@${config.project.name}`, pkg.name, 'library', pkg);
    if (bridge) {
      const native = nativeTargets(relBase, pkg, false);
      for (const target of ['build', 'test', 'typecheck']) {
        native[`${target}-types`] = {
          executor: 'nx:run-commands',
          options: {
            command: `npm run ${target}`,
            cwd: relBase,
          },
        };
        const existing = native[target];
        if (typeof existing === 'object' && existing !== null)
          native[target] = { ...existing, dependsOn: [`${target}-types`] };
      }
      project.targets = native;
    }
    await fs.writeFile(path.join(pkgDir, 'project.json'), `${JSON.stringify(project, null, 2)}\n`);
    await fs.writeFile(
      path.join(pkgDir, 'README.md'),
      `# ${pkg.name}\n\nShared Rust health DTOs with serde JSON support.${bridge ? ' TypeScript/Zod exports provide the same wire contract for web consumers.' : ''}\n`,
    );
    return [
      ...new Set([
        ...created,
        `${relBase}/Cargo.toml`,
        `${relBase}/src/lib.rs`,
        `${relBase}/project.json`,
        `${relBase}/README.md`,
      ]),
    ];
  }
  if (kind === 'contracts' && pkg.language === 'typescript') {
    return scaffoldContractsPackage(pkgDir, relBase, pkg, config);
  }
  return scaffoldGenericWorkspace(pkgDir, relBase, pkg, 'package', config);
}

export async function scaffoldWorkspaceApp(
  targetDir: string,
  app: WorkspaceEntry,
  config: BootstrapConfig,
  contractsPkgName: string | null,
  hasUiWeb: boolean,
): Promise<string[]> {
  const appDir = path.join(targetDir, 'apps', app.name);
  const relBase = `apps/${app.name}`;
  const kind = inferWorkspaceKind(app, 'app');

  if (app.language === 'solidity') {
    return scaffoldGenericWorkspace(appDir, relBase, app, 'app', config);
  }
  if (kind === 'backend') {
    return scaffoldBackendApp(appDir, relBase, app, config, contractsPkgName);
  }
  if (kind === 'web') {
    return scaffoldWebSampleApp(appDir, relBase, app, config, contractsPkgName, hasUiWeb);
  }
  return scaffoldGenericWorkspace(appDir, relBase, app, 'app', config);
}

export async function scaffoldExternalPipeline(
  targetDir: string,
  config: BootstrapConfig,
  uiPackagesCreated: UiPackageKind[],
): Promise<string[]> {
  const created: string[] = [];
  const pm = config.stack.packageManager;
  const runCmd = pm === 'npm' ? 'npm run' : pm;
  const linter = resolveRootLinter(config);
  const prettier = isPrettierEnabled(config);

  const scriptsDir = path.join(targetDir, 'scripts');
  const docsDir = path.join(targetDir, 'docs');
  await fs.mkdir(scriptsDir, { recursive: true });
  await fs.mkdir(docsDir, { recursive: true });

  const pipelineSh = `#!/usr/bin/env bash
set -euo pipefail

# External Bootstrap & Delivery Pipeline for ${config.project.name}
# Runs cleanly outside the CLI: install -> format -> lint -> typecheck -> build -> test -> validate

MODE="\${1:---all}"
PM="${pm}"
RUN="${runCmd}"

log() {
  printf "\\n[pipeline] %s\\n" "$1"
}

run_install() {
  log "1/6 Installing workspace dependencies with \${PM}..."
  \${PM} install
}

run_checks() {
  ${prettier ? `log "2/6 Checking root Prettier formatting..."\n  \${RUN} format:check` : 'log "2/6 Prettier skipped"'}
  ${linter !== 'none' ? `log "3/6 Running root-only linter (${linter})..."\n  \${RUN} lint` : 'log "3/6 Root linter skipped"'}
  log "4/6 Running workspace typecheck..."
  \${RUN} typecheck
}

run_build() {
  log "5/6 Building all workspace packages & apps..."
  \${RUN} build
}

run_test() {
  log "6/6 Running test suite & pattern validation gate..."
  \${RUN} test
  node scripts/validate.mjs
}

case "\${MODE}" in
  --install) run_install ;;
  --check) run_checks ;;
  --build) run_build ;;
  --test) run_test ;;
  --all)
    run_install
    run_checks
    run_build
    run_test
    log "All pipeline stages succeeded!"
    ;;
  *)
    echo "Usage: ./scripts/pipeline.sh [--all|--install|--check|--build|--test]"
    exit 1
    ;;
esac
`;

  const scriptPath = path.join(scriptsDir, 'pipeline.sh');
  await fs.writeFile(scriptPath, pipelineSh, 'utf-8');
  await fs.chmod(scriptPath, 0o755);
  created.push('scripts/pipeline.sh');

  const appsList = config.workspace.apps
    .map(
      (a) =>
        `- \`apps/${a.name}\` — **${inferWorkspaceKind(a, 'app')}** (${a.language} / ${a.framework})`,
    )
    .join('\n');
  const pkgsList = [
    ...config.workspace.packages.map(
      (p) =>
        `- \`packages/${p.name}\` — **${inferWorkspaceKind(p, 'package')}** (${p.language} / ${p.framework})`,
    ),
    ...uiPackagesCreated.map((u) => `- \`packages/${u}\` — **separated UI package** (TypeScript)`),
  ].join('\n');

  const pipelineDoc = `# External Pipeline & Workspace Architecture — ${config.project.name}

> Generated by **little.bootstrapper** (${config.architecture.pattern} / ${config.architecture.folderOrganization} / ${config.architecture.fileNaming})

## 1. Workspace Topology

### Applications (\`apps/\`)
${appsList || '- (none)'}

### Packages (\`packages/\`)
${pkgsList || '- (none)'}

## 2. Root-Only Code Quality Architecture

- **Root Linter**: \`${linter}\` (configured strictly at the repository root — never duplicated inside child apps or packages).
- **Root Formatter**: Prettier (${prettier ? 'enabled at root by default via `.prettierrc` and `.prettierignore`' : 'disabled'}).
- **Shared TypeScript Base**: \`tsconfig.base.json\` extended by every TypeScript app and package.

## 3. Outside Delivery Pipeline (\`scripts/pipeline.sh\`)

Run the full standalone verification pipeline outside the CLI at any time:

\`\`\`bash
./scripts/pipeline.sh --all
\`\`\`

### Pipeline Stages

| Stage | Flag | Command | Purpose |
| --- | --- | --- | --- |
| 1. Install | \`--install\` | \`${pm} install\` | Resolves all workspace links (\`packages/*\` → \`apps/*\`) |
| 2. Format | \`--check\` | \`${runCmd} format:check\` | Verifies root Prettier formatting across the monorepo |
| 3. Lint | \`--check\` | \`${runCmd} lint\` | Runs root-only \`${linter}\` rules across all workspaces |
| 4. Typecheck | \`--check\` | \`${runCmd} typecheck\` | Verifies strict TypeScript contracts across apps & packages |
| 5. Build | \`--build\` | \`${runCmd} build\` | Builds contracts, UI packages, backend API, and web app |
| 6. Test & Gate | \`--test\` | \`${runCmd} test && node scripts/validate.mjs\` | Executes unit tests and little.bootstrapper pattern checks |

## 4. Starter Product Verification

1. **Contracts (\`packages/contracts\`)**: Exports \`HealthResponseSchema\`, \`HEALTH_ENDPOINT_PATH\`, and \`createHealthPayload()\`.
2. **Backend Health Endpoint (\`apps/api\`)**: Serves \`GET /health\` on port \`4000\` returning the typed contract payload.
3. **Web Sample App (\`apps/web\`)**: Renders project parameters and queries \`GET /health\` using the shared contract.
`;

  await fs.writeFile(path.join(docsDir, 'PIPELINE.md'), pipelineDoc, 'utf-8');
  created.push('docs/PIPELINE.md');

  return created;
}
