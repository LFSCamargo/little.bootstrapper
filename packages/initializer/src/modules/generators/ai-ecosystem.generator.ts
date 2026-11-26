import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  AIAgent,
  AdditionalTool,
  BootstrapConfig,
  MarketplaceRuleId,
} from '../../types/index.js';
import {
  MARKETPLACE_RULES,
  getMarketplaceRuleById,
  resolveRulesForProject,
} from '../catalog/index.js';

export const UNIVERSAL_RULE_NAMES = MARKETPLACE_RULES.map((r) => r.id);

function renderRuleMarkdown(ruleId: MarketplaceRuleId, config?: BootstrapConfig): string {
  const rule = getMarketplaceRuleById(ruleId);
  if (!rule) {
    throw new Error(`Unknown marketplace rule "${ruleId}".`);
  }

  const header = `# Rule: ${rule.id}\n\n> little.bootstrapper Universal AI Rule (${rule.category}) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.\n\n`;

  if (ruleId === 'project-architecture' && config) {
    return `${header}- Architecture Pattern: \`${config.architecture.pattern}\`
- Folder Organization: \`${config.architecture.folderOrganization}\`
- File Naming Convention: \`${config.architecture.fileNaming}\`
- Test File Organization: \`${config.architecture.testOrganization}\`
- Strict Boundaries: \`${config.architecture.strictBoundaries}\`
- Path Aliases: \`${config.architecture.pathAliases}\`
- Barrel Exports: \`${config.architecture.barrelExports}\`
- Separated UI Packages: \`packages/ui-web\` and \`packages/ui-mobile\` (only what this stack uses); CLI UI components live inside the Ink app.
- Native workspaces (Go, Rust, Solidity) are orchestrated through Nx plugins: @nx-go/nx-go for Go with go.work, @monodon/rust for Rust with a root Cargo workspace, and nx:run-commands for Foundry/Hardhat. Each native project exposes build, test, typecheck, and (for apps) start/dev targets.
- **Atomic Unit Isolation**: \`src/commands/\`, \`src/modules/\`, \`src/ui/screens/\`, \`src/types/\`, \`src/assets/\` with barrel-only cross-module imports.
`;
  }

  if (ruleId === 'project-overview' && config) {
    const cov = config.testing?.coverage ?? { enabled: true, threshold: 75 };
    return `${header}- Project: **${config.project.name}**
- Description: ${config.project.description}
- Author: @${config.project.author}
- Languages: ${config.stack.languages.join(', ')}
- Package Manager: ${config.stack.packageManager}
- Frameworks: ${config.stack.frameworks.join(', ') || 'none'}
- Domains: ${(config.stack.domains ?? ['general']).join(', ')}
- Test Coverage Gate: ${cov.enabled ? `Enabled (${cov.threshold}% lines/statements/functions/branches)` : 'Disabled'}
`;
  }

  if (ruleId === 'test-driven' && config?.testing?.coverage) {
    const cov = config.testing.coverage;
    const coverageLine = cov.enabled
      ? `- Coverage enforcement: **Enabled** — minimum **${cov.threshold}%** across lines, statements, functions, and branches.`
      : '- Coverage enforcement: Disabled in `bootstrap.config.json`.';
    return `${header}${rule.body}\n${coverageLine}\n`;
  }

  return `${header}${rule.body}\n`;
}

function buildSkillContent(tool: AdditionalTool): string {
  switch (tool) {
    case 'ai-memory':
      return `---\nname: ai-memory\ndescription: Persistent cross-session memory using akitaonrails/ai-memory\n---\n# AI Memory Skill\n\nUse https://github.com/akitaonrails/ai-memory to store architectural decisions, gotchas, and session handoffs.\n`;
    case 'commitlint-husky-prettier':
      return `---\nname: commitlint-husky-prettier\ndescription: Enforce conventional commits, git hooks, and Prettier formatting\n---\n# CommitLint + Husky + Prettier\n\nEnsure all commits follow Conventional Commits (\`feat:\`, \`fix:\`, \`chore:\`, \`docs:\`) and pass Prettier formatting.\n`;
    case 'security-checker':
      return `---\nname: security-checker\ndescription: Run OpenGrep SAST and GitLeaks secret scanning\n---\n# Security Checker (OpenGrep + GitLeaks)\n\nRun \`opengrep scan --config .opengrep.yml\` and \`gitleaks detect --config .gitleaks.toml --source .\` before merging.\n`;
    case 'spaghetti-checker':
      return `---\nname: spaghetti-checker\ndescription: Detect code spaghetti with arborist-metrics\n---\n# Spaghetti Checker (arborist-metrics)\n\nUse https://github.com/StrangeDaysTech/arborist-metrics to identify high cyclomatic complexity, deep nesting, and tangled dependencies.\n`;
    case 'complexity-checker':
      return `---\nname: complexity-checker\ndescription: O(1) Complexity Checker for algorithmic hotspots\n---\n# O(1) Complexity Checker\n\nAudit loops, nested iterations, and lookups. Flag O(n^2) or worse operations on unbounded collections and refactor toward O(1) map/set lookups or O(n) single-pass algorithms.\n`;
    case 'n-plus-one-checker':
      return `---\nname: n-plus-one-checker\ndescription: N+1 SQL Queries Checker for data access layers\n---\n# N+1 SQL Queries Checker\n\nInspect ORM/SQL execution layers for queries executed inside loops and replace N+1 patterns with JOINs, \`IN (...)\` batching, or DataLoaders.\n`;
    case 'commit-separately':
      return `---\nname: commit-separately\ndescription: Split working tree changes into clean, logical PR commits\n---\n# Commit Separately Skill\n\n1. Inspect \`git status\` and \`git diff\`.\n2. Group hunks by logical concern (types, logic, tests, docs).\n3. Stage and commit each group separately with Conventional Commits.\n`;
    case 'financial-audit':
      return `---\nname: financial-audit\ndescription: Audit financial/fintech code for float money bugs, missing idempotency, and mutable ledgers\n---\n# Financial Audit Skill\n\nScan for IEEE-754 float money calculations, missing \`Idempotency-Key\` constraints, \`UPDATE\`/\`DELETE\` on ledger tables, missing ACID row locks, and unredacted PII/PCI logs.\n`;
    case 'docs-pruner':
      return `---\nname: docs-pruner\ndescription: Audit markdown files to prevent documentation sprawl and bloated AI rules\n---\n# Docs Pruner Skill\n\nFlag duplicate/ephemeral markdown files, oversized AI rules (>80 lines), and inactive-stack rules in \`.ai/rules/\`. Keep reusable templates in \`templates/rules/\`.\n`;
    case 'nx-workspace-audit':
      return `---\nname: nx-workspace-audit\ndescription: Audit NX monorepo boundaries, project.json targets, and cross-package imports\n---\n# NX Workspace Audit Skill\n\nVerify no relative cross-package imports (\`../../packages/\`), confirm \`project.json\` targets, \`workspace:*\` links, and separated UI packages.\n`;
    case 'playwright-e2e-author':
      return `---\nname: playwright-e2e-author\ndescription: Author flake-free Playwright E2E specs in tests/e2e/ using accessible locators\n---\n# Playwright E2E Author Skill\n\nWrite browser E2E specs under \`tests/e2e/\` using \`getByRole\`/\`getByTestId\`, zero \`waitForTimeout()\`, and \`pageerror\` assertions.\n`;
    case 'mcp-security-audit':
      return `---\nname: mcp-security-audit\ndescription: Audit mcp.json for verified MCP servers, read-only modes, and zero hardcoded secrets\n---\n# MCP Security Audit Skill\n\nVerify all entries in \`mcp.json\` come from \`little-bootstrapper mcps --list\`, use \`\${ENV_VAR}\` placeholders, and enforce read-only DB modes.\n`;
  }
}

export async function installMarketplaceRules(
  targetDir: string,
  ruleIds: MarketplaceRuleId[],
  config?: BootstrapConfig,
): Promise<string[]> {
  const rulesDir = path.join(targetDir, '.ai', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });
  const created: string[] = [];

  for (const ruleId of ruleIds) {
    const rulePath = path.join(rulesDir, `${ruleId}.md`);
    await fs.writeFile(rulePath, renderRuleMarkdown(ruleId, config), 'utf-8');
    created.push(path.relative(targetDir, rulePath));
  }

  return created;
}

export async function generateUniversalAIEcosystem(
  targetDir: string,
  config: BootstrapConfig,
): Promise<string[]> {
  const created: string[] = [];
  const rulesDir = path.join(targetDir, '.ai', 'rules');
  const skillsDir = path.join(targetDir, '.ai', 'skills');
  await fs.mkdir(rulesDir, { recursive: true });
  await fs.mkdir(skillsDir, { recursive: true });

  // Context-selective rules: install ONLY rules matching this project's languages, frameworks & domains!
  const activeRules = resolveRulesForProject(config);
  const activeRuleFiles = new Set(activeRules.map((r) => `${r}.md`));

  // Prune inactive-stack rules from .ai/rules/ so LLM context stays clean and bloat-free
  try {
    const existingEntries = await fs.readdir(rulesDir);
    for (const file of existingEntries) {
      if (file.endsWith('.md') && !activeRuleFiles.has(file)) {
        await fs.rm(path.join(rulesDir, file), { force: true });
      }
    }
  } catch {
    // Directory newly created
  }

  const ruleFiles = await installMarketplaceRules(targetDir, activeRules, config);
  created.push(...ruleFiles);

  // Auto-include financial-audit skill when financial domain is selected
  const activeTools = new Set<AdditionalTool>(config.stack.tools);
  if ((config.stack.domains ?? []).includes('financial')) {
    activeTools.add('financial-audit');
  }

  for (const tool of activeTools) {
    const skillFolder = path.join(skillsDir, tool);
    await fs.mkdir(skillFolder, { recursive: true });
    const skillPath = path.join(skillFolder, 'SKILL.md');
    await fs.writeFile(skillPath, buildSkillContent(tool), 'utf-8');
    created.push(path.relative(targetDir, skillPath));
  }

  const universalInstructions = `# ${config.project.name} — Universal AI Agent Instructions

> Generated by \`little.bootstrapper\` — Good news, everyone!

All AI agents (Open Code, Antigravity, Claude, Codex, Cursor) share the exact same context-selective canonical rules and skills in \`.ai/\`:

- **Active Rules** (\`.ai/rules/*.md\`): ${activeRules.join(', ')}
- **Active Skills** (\`.ai/skills/*/SKILL.md\`): ${Array.from(activeTools).join(', ') || 'none'}
- **Bootstrap Config**: \`bootstrap.config.json\`
- **Anti-Doc-Sprawl**: Follow \`.ai/rules/ai-docs-discipline.md\` — update canonical docs in place and never spawn throwaway markdown dumps.
`;

  const agents = new Set<AIAgent>(config.stack.agents);

  if (agents.has('opencode') || agents.has('codex')) {
    await fs.writeFile(path.join(targetDir, 'AGENTS.md'), universalInstructions, 'utf-8');
    created.push('AGENTS.md');
  }
  if (agents.has('opencode')) {
    const p = path.join(targetDir, '.opencode', 'README.md');
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(
      p,
      'Open Code reads canonical rules from `AGENTS.md` and `.ai/rules/`.\n',
      'utf-8',
    );
    created.push('.opencode/README.md');
  }
  if (agents.has('codex')) {
    const p = path.join(targetDir, '.codex', 'README.md');
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(
      p,
      'Codex reads canonical rules from `AGENTS.md` and `.ai/rules/`.\n',
      'utf-8',
    );
    created.push('.codex/README.md');
  }
  if (agents.has('claude')) {
    await fs.writeFile(path.join(targetDir, 'CLAUDE.md'), universalInstructions, 'utf-8');
    created.push('CLAUDE.md');
    const claudeRules = path.join(targetDir, '.claude', 'rules', 'universal.md');
    await fs.mkdir(path.dirname(claudeRules), { recursive: true });
    await fs.writeFile(claudeRules, universalInstructions, 'utf-8');
    created.push('.claude/rules/universal.md');
  }
  if (agents.has('antigravity')) {
    const agyRule = path.join(targetDir, '.agent', 'rules', 'universal.md');
    await fs.mkdir(path.dirname(agyRule), { recursive: true });
    await fs.writeFile(agyRule, universalInstructions, 'utf-8');
    created.push('.agent/rules/universal.md');
  }
  if (agents.has('cursor')) {
    const cursorRule = path.join(targetDir, '.cursor', 'rules', 'universal.mdc');
    await fs.mkdir(path.dirname(cursorRule), { recursive: true });
    const mdc = `---\ndescription: Universal little.bootstrapper AI Rules\nglobs: "**/*"\nalwaysApply: true\n---\n\n${universalInstructions}`;
    await fs.writeFile(cursorRule, mdc, 'utf-8');
    created.push('.cursor/rules/universal.mdc');
  }

  return created;
}
