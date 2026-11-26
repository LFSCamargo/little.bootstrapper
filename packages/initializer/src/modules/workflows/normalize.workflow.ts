import fs from 'node:fs/promises';
import os from 'node:os';
import { BootstrapConfigSchema, WorkspaceNameSchema } from '../validation/index.js';
import path from 'node:path';
import type {
  AIAgent,
  AdditionalTool,
  BootstrapConfig,
  DetectedSetup,
  Language,
  Framework,
  WorkspaceKind,
  McpServerId,
  PackageManager,
  UiPackageKind,
} from '../../types/index.js';
import { ADDITIONAL_TOOLS, AI_AGENTS, resolveRulesForProject } from '../catalog/index.js';
import {
  generateUniversalAIEcosystem,
  generateMcpConfig,
  loadBootstrapConfig,
} from '../generators/index.js';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectCurrentSetup(targetDir: string): Promise<DetectedSetup> {
  const hasBootstrapConfig = await exists(path.join(targetDir, 'bootstrap.config.json'));

  const manifestPath = path.join(targetDir, 'package.json');
  const manifest = (await exists(manifestPath))
    ? JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    : {};
  const declaredManager =
    typeof manifest.packageManager === 'string' ? manifest.packageManager.split('@')[0] : undefined;
  let packageManager: PackageManager | null = null;
  if (['pnpm', 'npm', 'bun', 'yarn'].includes(declaredManager)) packageManager = declaredManager;
  else if (await exists(path.join(targetDir, 'yarn.lock'))) packageManager = 'yarn';
  else if (await exists(path.join(targetDir, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (
    (await exists(path.join(targetDir, 'bun.lock'))) ||
    (await exists(path.join(targetDir, 'bun.lockb')))
  )
    packageManager = 'bun';
  else if (await exists(path.join(targetDir, 'package-lock.json'))) packageManager = 'npm';

  const monorepo = Boolean(
    manifest.workspaces?.length ||
      manifest.workspaces?.packages?.length ||
      (await exists(path.join(targetDir, 'nx.json'))) ||
      (await exists(path.join(targetDir, 'pnpm-workspace.yaml'))) ||
      (await exists(path.join(targetDir, 'go.work'))),
  );
  const roots = [targetDir];
  for (const group of ['apps', 'packages']) {
    const parent = path.join(targetDir, group);
    if (!(await exists(parent))) continue;
    for (const entry of await fs.readdir(parent, { withFileTypes: true })) {
      if (entry.isDirectory()) roots.push(path.join(parent, entry.name));
    }
  }
  const languages: Language[] = [];
  const markers: Record<Language, string[]> = {
    typescript: ['tsconfig.json', 'tsconfig.base.json'],
    golang: ['go.mod', 'go.work'],
    rust: ['Cargo.toml', 'src-tauri/Cargo.toml'],
    solidity: ['foundry.toml', 'hardhat.config.ts', 'hardhat.config.cjs'],
  };
  for (const language of Object.keys(markers) as Language[]) {
    const matches = await Promise.all(
      roots.flatMap((root) => markers[language].map((file) => exists(path.join(root, file)))),
    );
    if (matches.some(Boolean)) languages.push(language);
  }

  const frameworks = new Set<Framework>();
  const workspace: BootstrapConfig['workspace'] = { apps: [], packages: [] };
  const appTechnologies: [Framework, WorkspaceKind, string][] = [
    ['tauri', 'web', '@tauri-apps/api'],
    ['nextjs', 'web', 'next'],
    ['nuxtjs', 'web', 'nuxt'],
    ['react-native', 'mobile', 'react-native'],
    ['react-vite', 'web', 'vite'],
    ['hono', 'backend', 'hono'],
    ['express', 'backend', 'express'],
    ['elysia', 'backend', 'elysia'],
    ['fastify', 'backend', 'fastify'],
    ['koa', 'backend', 'koa'],
    ['ink', 'cli', 'ink'],
  ];
  for (const root of roots) {
    const pkgPath = path.join(root, 'package.json');
    if (!(await exists(pkgPath))) continue;
    const pkg = root === targetDir ? manifest : JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const deps = { ...pkg.devDependencies, ...pkg.dependencies };
    const matches = appTechnologies.filter(
      ([id, , dep]) => deps[dep] && (id !== 'react-vite' || deps.react),
    );
    for (const [id] of matches) frameworks.add(id);
    if (deps.vitest) frameworks.add('vitest');
    if (deps['@playwright/test']) frameworks.add('playwright');
    const name = path.basename(root);
    const bucket = path.basename(path.dirname(root));
    const primary = matches[0];
    if (
      root !== targetDir &&
      primary &&
      (bucket === 'apps' || bucket === 'packages') &&
      WorkspaceNameSchema.safeParse(name).success &&
      (await exists(path.join(root, 'tsconfig.json')))
    ) {
      workspace[bucket].push({
        name,
        language: 'typescript',
        framework: primary[0],
        kind: bucket === 'apps' ? primary[1] : 'library',
      });
    }
  }

  const agents: AIAgent[] = [];
  if (await exists(path.join(targetDir, '.opencode'))) agents.push('opencode');
  if (await exists(path.join(targetDir, '.agent'))) agents.push('antigravity');
  if (
    (await exists(path.join(targetDir, 'CLAUDE.md'))) ||
    (await exists(path.join(targetDir, '.claude')))
  ) {
    agents.push('claude');
  }
  if (await exists(path.join(targetDir, '.codex'))) agents.push('codex');
  if (await exists(path.join(targetDir, '.cursor'))) agents.push('cursor');

  const tools: AdditionalTool[] = [];
  for (const t of ADDITIONAL_TOOLS) {
    if (await exists(path.join(targetDir, '.ai', 'skills', t.id, 'SKILL.md'))) {
      tools.push(t.id);
    }
  }

  const loadedCfg = await loadBootstrapConfig(targetDir);
  if (hasBootstrapConfig && !loadedCfg)
    throw new Error('Cannot normalize invalid bootstrap.config.json');
  const expectedRules = loadedCfg
    ? resolveRulesForProject(loadedCfg)
    : [
        'quality-gating',
        'security',
        'test-driven',
        'regression-testing',
        'e2e-testing',
        'project-architecture',
        'project-overview',
        'docs-sync',
        'ai-docs-discipline',
      ];

  const rulesPresent: string[] = [];
  const rulesMissing: string[] = [];
  for (const r of expectedRules) {
    if (await exists(path.join(targetDir, '.ai', 'rules', `${r}.md`))) {
      rulesPresent.push(r);
    } else {
      rulesMissing.push(r);
    }
  }

  const uiPackagesPresent: UiPackageKind[] = [];
  for (const kind of ['ui-cli', 'ui-web', 'ui-mobile'] as const) {
    if (await exists(path.join(targetDir, 'packages', kind))) {
      uiPackagesPresent.push(kind);
    }
  }

  const hasSecurityConfigs =
    (await exists(path.join(targetDir, '.opengrep.yml'))) &&
    (await exists(path.join(targetDir, '.gitleaks.toml')));

  const hasCommitHooks =
    (await exists(path.join(targetDir, '.husky'))) &&
    (await exists(path.join(targetDir, 'commitlint.config.mjs')));

  let hasMcpConfig = false;
  let mcpsConfigured: string[] = [];
  const mcpPath = path.join(targetDir, 'mcp.json');
  if (await exists(mcpPath)) {
    hasMcpConfig = true;
    try {
      const parsed = JSON.parse(await fs.readFile(mcpPath, 'utf-8')) as {
        mcpServers?: Record<string, unknown>;
      };
      if (parsed.mcpServers) {
        mcpsConfigured = Object.keys(parsed.mcpServers);
      }
    } catch {
      // Ignore malformed mcp.json
    }
  }

  return {
    hasBootstrapConfig,
    frameworks: [...frameworks],
    workspace,
    monorepo,
    packageManager,
    languages,
    agents,
    tools,
    missingTools: ADDITIONAL_TOOLS.map((t) => t.id).filter((id) => !tools.includes(id)),
    missingAgents: AI_AGENTS.map((a) => a.id).filter((id) => !agents.includes(id)),
    rulesPresent,
    rulesMissing,
    uiPackagesPresent,
    hasSecurityConfigs,
    hasCommitHooks,
    hasMcpConfig,
    mcpsConfigured,
  };
}

async function checkNormalizationPaths(targetDir: string, files: string[]): Promise<void> {
  const checked = new Set<string>();
  for (const file of files) {
    let current = targetDir;
    for (const segment of file.split(path.sep)) {
      current = path.join(current, segment);
      if (checked.has(current)) continue;
      checked.add(current);
      const stat = await fs.lstat(current).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
        return undefined;
      });
      if (stat?.isSymbolicLink())
        throw new Error(
          `Normalization target is a symbolic link: ${path.relative(targetDir, current)}`,
        );
    }
  }
}

export async function applyNormalization(
  targetDir: string,
  selectedAgents: AIAgent[],
  selectedTools: AdditionalTool[],
  normalizingAgent: AIAgent = selectedAgents[0] ?? 'claude',
  selectedMcps?: McpServerId[],
): Promise<{ filesUpdated: string[]; normalizingAgent: AIAgent }> {
  const existing = await loadBootstrapConfig(targetDir);
  const detected = await detectCurrentSetup(targetDir);

  const config: BootstrapConfig = existing ?? {
    version: '1.0.0',
    project: {
      name:
        path
          .basename(path.resolve(targetDir))
          .replace(/[^a-zA-Z0-9._-]+/g, '-')
          .replace(/^[^a-zA-Z0-9]+/, '')
          .slice(0, 100) || 'project',
      description: 'Normalized with little.bootstrapper',
      author: 'crew',
      codeowners: false,
    },
    stack: {
      languages: detected.languages.length > 0 ? detected.languages : ['typescript'],
      packageManager: detected.packageManager ?? 'yarn',
      monorepo: detected.monorepo || detected.uiPackagesPresent.length > 0,
      useMakefiles: false,
      frameworks: detected.frameworks,
      tools: selectedTools,
      agents: selectedAgents,
      mcps: selectedMcps ?? [],
    },
    workspace: detected.workspace,
    architecture: {
      pattern: 'standard',
      folderOrganization: 'flat',
      fileNaming: 'kebab-case',
      testOrganization: 'dedicated-tests',
      strictBoundaries: false,
      pathAliases: true,
      barrelExports: true,
      exampleModule: false,
    },
  };

  config.stack.agents = Array.from(new Set(selectedAgents));
  config.stack.tools = Array.from(new Set(selectedTools));
  if (selectedMcps) {
    config.stack.mcps = Array.from(new Set(selectedMcps));
  }

  BootstrapConfigSchema.parse(config);
  const filesUpdated: string[] = [];
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'normalize-ai-'));
  try {
    const generated = await generateUniversalAIEcosystem(staging, config);
    // Existing instruction files (including linked files) are already installed.
    const missing = [];
    for (const file of generated) {
      if (!(await exists(path.join(targetDir, file)))) missing.push(file);
    }
    await checkNormalizationPaths(targetDir, [
      ...missing,
      '.ai/normalization-plan.md',
      'bootstrap.config.json',
      ...(config.stack.mcps?.length
        ? [
            'mcp.json',
            '.env.example',
            ...(config.stack.agents.includes('cursor') ? ['.cursor/mcp.json'] : []),
            ...(config.stack.agents.includes('claude') ? ['.mcp.json'] : []),
          ]
        : []),
      ...(config.stack.tools.includes('security-checker')
        ? ['.opengrep.yml', '.gitleaks.toml']
        : []),
      ...(config.stack.tools.includes('commitlint-husky-prettier')
        ? ['.prettierrc', 'commitlint.config.mjs']
        : []),
    ]);
    for (const file of missing) {
      const destination = path.join(targetDir, file);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      try {
        await fs.copyFile(path.join(staging, file), destination, fs.constants.COPYFILE_EXCL);
        filesUpdated.push(file);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
    }
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }

  if (config.stack.mcps && config.stack.mcps.length > 0) {
    const mcpRes = await generateMcpConfig(targetDir, config.stack.mcps, config.stack.agents);
    filesUpdated.push(...mcpRes.filesWritten);
  }

  if (config.stack.tools.includes('security-checker')) {
    if (!(await exists(path.join(targetDir, '.opengrep.yml')))) {
      await fs.writeFile(
        path.join(targetDir, '.opengrep.yml'),
        `rules:\n  - id: planet-express-no-eval\n    pattern: eval(...)\n    message: "Avoid eval()"\n    languages: [typescript, javascript]\n    severity: ERROR\n`,
        'utf-8',
      );
      filesUpdated.push('.opengrep.yml');
    }
    if (!(await exists(path.join(targetDir, '.gitleaks.toml')))) {
      await fs.writeFile(
        path.join(targetDir, '.gitleaks.toml'),
        `title = "${config.project.name} GitLeaks Config"\n[extend]\nuseDefault = true\n`,
        'utf-8',
      );
      filesUpdated.push('.gitleaks.toml');
    }
  }

  if (config.stack.tools.includes('commitlint-husky-prettier')) {
    if (!(await exists(path.join(targetDir, '.prettierrc')))) {
      await fs.writeFile(
        path.join(targetDir, '.prettierrc'),
        `${JSON.stringify({ semi: true, singleQuote: true, trailingComma: 'all', printWidth: 100 }, null, 2)}\n`,
        'utf-8',
      );
      filesUpdated.push('.prettierrc');
    }
    if (!(await exists(path.join(targetDir, 'commitlint.config.mjs')))) {
      await fs.writeFile(
        path.join(targetDir, 'commitlint.config.mjs'),
        `export default { extends: ['@commitlint/config-conventional'] };\n`,
        'utf-8',
      );
      filesUpdated.push('commitlint.config.mjs');
    }
  }

  const planPath = path.join(targetDir, '.ai', 'normalization-plan.md');
  const planContent = `# Normalization Report

- **Executed By Agent**: \`${normalizingAgent}\`
- **Active AI Agents**: ${config.stack.agents.join(', ')}
- **Active Tools & Skills**: ${config.stack.tools.join(', ')}
- **Verified Safe MCPs**: ${(config.stack.mcps ?? []).join(', ') || 'None'}
- **Separated UI Packages Present**: ${detected.uiPackagesPresent.join(', ') || 'None detected yet (recommended: packages/ui-web, packages/ui-mobile; CLI UI components live inside the Ink app)'}
`;
  await fs.writeFile(planPath, planContent, 'utf-8');
  filesUpdated.push('.ai/normalization-plan.md');

  await fs.writeFile(
    path.join(targetDir, 'bootstrap.config.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf-8',
  );
  filesUpdated.push('bootstrap.config.json');

  return { filesUpdated, normalizingAgent };
}
