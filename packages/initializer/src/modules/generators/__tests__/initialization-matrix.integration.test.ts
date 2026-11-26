import { it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject, generateModule } from '../index.js';
import { backendConfig } from './fixtures/backend-config.js';
import {
  ARCHITECTURE_PATTERNS,
  FILE_NAMING_CONVENTIONS,
  TEST_FILE_ORGANIZATIONS,
} from '../../architecture/index.js';
import { defaultWorkspaces, recommendedFrameworks } from '../../catalog/index.js';
import type { Framework, Language, WorkspaceKind } from '../../../types/index.js';

const templates: [Framework, Language, WorkspaceKind, string][] = [
  ...(['hono', 'express', 'fastify', 'koa', 'elysia'] as const).map(
    (fw): [Framework, Language, WorkspaceKind, string] => [
      fw,
      'typescript',
      'backend',
      'src/index.ts',
    ],
  ),
  ['nextjs', 'typescript', 'web', 'src/app/page.tsx'],
  ['react-vite', 'typescript', 'web', 'index.html'],
  ['nuxtjs', 'typescript', 'web', 'src/app.vue'],
  ['ink', 'typescript', 'cli', 'src/main.tsx'],
  ...(['chi', 'gin', 'echo', 'fiber'] as const).map(
    (fw): [Framework, Language, WorkspaceKind, string] => [fw, 'golang', 'backend', 'main.go'],
  ),
  ...(['axum', 'hyper'] as const).map((fw): [Framework, Language, WorkspaceKind, string] => [
    fw,
    'rust',
    'backend',
    'src/main.rs',
  ]),
  ['hardhat', 'solidity', 'contracts', 'hardhat.config.cjs'],
  ['foundry', 'solidity', 'contracts', 'foundry.toml'],
];

it.each(templates)(
  'creates a complete %s workspace entry and correct Nx commands',
  async (framework, language, kind, entry) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'init-matrix-'));
    try {
      const config = backendConfig('axum');
      config.stack.languages = [language];
      config.stack.frameworks = [framework];
      config.stack.packageManager = framework === 'elysia' ? 'bun' : 'yarn';
      config.workspace =
        kind === 'contracts'
          ? { apps: [], packages: [{ name: 'contracts', framework, language, kind }] }
          : { apps: [{ name: 'app', framework, language, kind }], packages: [] };
      const result = await generateProject(dir, config);
      const base = kind === 'contracts' ? 'packages/contracts' : 'apps/app';
      expect(result.filesCreated).toContain(`${base}/${entry}`);
      const project = JSON.parse(await fs.readFile(path.join(dir, base, 'project.json'), 'utf8'));
      if (language === 'typescript') {
        expect(project.targets.build.options).toEqual({ command: 'npm run build', cwd: base });
        expect(result.filesCreated).toContain(`${base}/vitest.config.ts`);
      }
      if (language === 'rust') expect(project.targets.build.executor).toBe('@monodon/rust:build');
      if (language === 'golang') expect(project.targets.build.executor).toBe('@nx-go/nx-go:build');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  },
);

for (const pattern of ARCHITECTURE_PATTERNS) {
  for (const naming of FILE_NAMING_CONVENTIONS) {
    for (const tests of TEST_FILE_ORGANIZATIONS) {
      it(`preserves modules and discovers tests: ${pattern.id}, ${naming.id}, ${tests.id}`, async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-matrix-'));
        try {
          const config = backendConfig('axum');
          config.stack.languages = ['typescript'];
          config.stack.frameworks = ['hono'];
          config.workspace = {
            apps: [{ name: 'api', framework: 'hono', language: 'typescript', kind: 'backend' }],
            packages: [],
          };
          config.architecture = {
            ...config.architecture,
            pattern: pattern.id,
            fileNaming: naming.id,
            testOrganization: tests.id,
            exampleModule: true,
          };
          const output = await generateProject(dir, config);
          expect(
            output.filesCreated.some(
              (f) => f.startsWith('apps/api/') && f.toLowerCase().includes('health'),
            ),
          ).toBe(true);
          const files = await generateModule(
            dir,
            'second-module',
            config,
            'typescript',
            'apps/api',
          );
          expect(files.every((file) => file.startsWith('apps/api/'))).toBe(true);
          const test = files.find((file) => file.endsWith('.test.ts'))!;
          const contents = await fs.readFile(path.join(dir, test), 'utf8');
          expect(contents).toContain('executeSecondModule()');
          const imported = contents.match(/from '([^']+\.js)'/)![1];
          await expect(
            fs.stat(
              path.resolve(path.dirname(path.join(dir, test)), imported.replace(/\.js$/, '.ts')),
            ),
          ).resolves.toBeDefined();
          await expect(
            generateModule(dir, 'second-module', config, 'typescript', 'apps/api'),
          ).rejects.toThrow('already exists');
          const rootVitest = await fs.readFile(path.join(dir, 'vitest.config.ts'), 'utf8');
          expect(rootVitest).toContain('src/**/*.test.{ts,tsx}');
          expect(rootVitest).toContain('tests/**/*.test.{ts,tsx}');
        } finally {
          await fs.rm(dir, { recursive: true, force: true });
        }
      });
    }
  }
}

it('headless Ink creates a runnable CLI and API defaults get contracts without an explicit test selection', () => {
  expect(defaultWorkspaces(['typescript'], ['ink'], 'yarn').apps[0]?.kind).toBe('cli');
  expect(defaultWorkspaces(['typescript'], ['hono'], 'yarn').packages[0]?.kind).toBe('contracts');
});

const languages: Language[] = ['typescript', 'golang', 'rust', 'solidity'];
for (let mask = 1; mask < 2 ** languages.length; mask++) {
  const selected = languages.filter((_, index) => (mask & (1 << index)) !== 0);
  it.each(['npm', 'pnpm', 'yarn', 'bun'] as const)(
    `initializes ${selected.join('+')} defaults with %s`,
    async (pm) => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'polyglot-init-'));
      try {
        const config = backendConfig('axum');
        config.stack.languages = selected;
        config.stack.frameworks = recommendedFrameworks(selected);
        config.stack.packageManager = pm;
        config.workspace = defaultWorkspaces(selected, config.stack.frameworks, pm);
        await generateProject(dir, config);
        const generated = JSON.parse(
          await fs.readFile(path.join(dir, 'bootstrap.config.json'), 'utf8'),
        );
        const represented = new Set<Language>();
        for (const bucket of ['apps', 'packages'] as const) {
          for (const entry of generated.workspace[bucket]) {
            represented.add(entry.language);
            await expect(
              fs.stat(path.join(dir, bucket, entry.name, 'project.json')),
            ).resolves.toBeDefined();
          }
        }
        expect(represented).toEqual(new Set(selected));
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
    },
  );
}
