import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  AIAgent,
  AdditionalTool,
  BootstrapConfig,
  DetectedSetup,
  Language,
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

  let packageManager: PackageManager | null = null;
  if (await exists(path.join(targetDir, 'yarn.lock'))) packageManager = 'yarn';
  else if (await exists(path.join(targetDir, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (await exists(path.join(targetDir, 'bun.lockb'))) packageManager = 'bun';
  else if (await exists(path.join(targetDir, 'package-lock.json'))) packageManager = 'npm';

  const languages: Language[] = [];
  if (
    (await exists(path.join(targetDir, 'tsconfig.json'))) ||
    (await exists(path.join(targetDir, 'tsconfig.base.json')))
  ) {
    languages.push('typescript');
  }
  if (await exists(path.join(targetDir, 'go.mod'))) languages.push('golang');
  if (await exists(path.join(targetDir, 'Cargo.toml'))) languages.push('rust');
  if (
    (await exists(path.join(targetDir, 'foundry.toml'))) ||
    (await exists(path.join(targetDir, 'hardhat.config.ts')))
  ) {
    languages.push('solidity');
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
      name: path.basename(targetDir),
      description: 'Normalized with Planet Express little.bootstrapper',
      author: 'crew',
      codeowners: false,
    },
    stack: {
      languages: detected.languages.length > 0 ? detected.languages : ['typescript'],
      packageManager: detected.packageManager ?? 'yarn',
      monorepo: detected.uiPackagesPresent.length > 0,
      useMakefiles: false,
      frameworks: [],
      tools: selectedTools,
      agents: selectedAgents,
      mcps: selectedMcps ?? [],
    },
    workspace: { apps: [], packages: [] },
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

  const filesUpdated = await generateUniversalAIEcosystem(targetDir, config);

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
- **Separated UI Packages Present**: ${detected.uiPackagesPresent.join(', ') || 'None detected yet (recommended: packages/ui-cli, packages/ui-web, packages/ui-mobile)'}
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
