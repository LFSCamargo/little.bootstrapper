import fs from 'node:fs/promises';
import path from 'node:path';
import { getVerifiedMcpById, resolveRulesForProject } from '../catalog/index.js';
import { loadBootstrapConfig } from '../generators/index.js';
import { auditProjectVersions } from './update.workflow.js';
import { detectCurrentSetup } from './normalize.workflow.js';

export interface PatternCheckResult {
  id: string;
  name: string;
  passed: boolean;
  details: string[];
}

export interface PatternValidationReport {
  targetDir: string;
  passed: boolean;
  totalChecks: number;
  failedChecks: number;
  checks: PatternCheckResult[];
}

const FORBIDDEN_DOC_PATTERNS = [
  /^NOTES\.md$/i,
  /^TODO\.md$/i,
  /^SUMMARY\.md$/i,
  /^CHANGES\.md$/i,
  /^ARCHITECTURE_V\d+\.md$/i,
  /^PLAN_FINAL\.md$/i,
];

const SECRET_REGEX =
  /(?:api_key|secret_key|password|access_token|private_key)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i;

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootDir: string, maxDepth = 5): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.next' ||
        entry.name === 'dist' ||
        entry.name === '.nx' ||
        entry.name === 'coverage' ||
        entry.name === 'test-results' ||
        entry.name === 'playwright-report' ||
        entry.name === 'templates'
      ) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir, 0);
  return results;
}

export async function validateProjectPatterns(targetDir: string): Promise<PatternValidationReport> {
  const checks: PatternCheckResult[] = [];
  const allFiles = await walkFiles(targetDir);
  const relFiles = allFiles.map((f) => path.relative(targetDir, f));

  // 1. Pinned & Audited Versions Check
  const versionAudit = await auditProjectVersions(targetDir);
  const badVersions = versionAudit.filter((v) => v.needsUpdate);
  checks.push({
    id: 'pinned-audited-deps',
    name: 'Pinned & Audited Dependencies (Zero ^/~ ranges & zero known CVEs)',
    passed: badVersions.length === 0,
    details:
      badVersions.length === 0
        ? [`Audited ${versionAudit.length} dependencies — all strictly pinned and CVE-free.`]
        : badVersions.map(
            (v) =>
              `${v.file}: ${v.packageName}@${v.currentVersion} -> ${v.recommendedVersion} [${v.status}]`,
          ),
  });

  // 2. Bootstrap Config & Context-Selective Universal AI Ecosystem Check
  const cfg = await loadBootstrapConfig(targetDir);
  const detected = await detectCurrentSetup(targetDir);
  const aiIssues: string[] = [];
  if (!cfg) {
    aiIssues.push('Missing or Zod-invalid bootstrap.config.json');
  } else {
    const expectedRules = resolveRulesForProject(cfg);
    for (const r of expectedRules) {
      if (!(await exists(path.join(targetDir, '.ai', 'rules', `${r}.md`)))) {
        aiIssues.push(`Missing active rule: .ai/rules/${r}.md`);
      }
    }
    for (const agent of cfg.stack.agents) {
      if (!detected.agents.includes(agent)) {
        aiIssues.push(`Missing configured AI agent adapter: ${agent}`);
      }
    }
  }
  checks.push({
    id: 'universal-ai-ecosystem',
    name: 'Universal AI Ecosystem & Context-Selective Rules',
    passed: aiIssues.length === 0,
    details:
      aiIssues.length === 0
        ? [
            `Verified bootstrap.config.json, ${detected.agents.length} AI agents, and ${detected.rulesPresent.length} active rules.`,
          ]
        : aiIssues,
  });

  // 3. Verified MCP Security Audit
  const mcpIssues: string[] = [];
  for (const mcpRel of ['mcp.json', '.cursor/mcp.json', '.mcp.json']) {
    const mcpFull = path.join(targetDir, mcpRel);
    if (!(await exists(mcpFull))) continue;
    try {
      const raw = await fs.readFile(mcpFull, 'utf-8');
      const parsed = JSON.parse(raw) as {
        mcpServers?: Record<string, { env?: Record<string, string> }>;
      };
      for (const [id, entry] of Object.entries(parsed.mcpServers ?? {})) {
        if (!getVerifiedMcpById(id)) {
          mcpIssues.push(`${mcpRel}: Unverified MCP server "${id}" is not in the safe catalog`);
        }
        if (entry?.env) {
          for (const [k, v] of Object.entries(entry.env)) {
            if (!v.startsWith('${') || !v.endsWith('}')) {
              mcpIssues.push(
                `${mcpRel}: Hardcoded secret in ${id}.env.${k} (must use \${ENV_VAR})`,
              );
            }
          }
        }
      }
    } catch {
      mcpIssues.push(`${mcpRel}: Malformed JSON`);
    }
  }
  checks.push({
    id: 'mcp-security-audit',
    name: 'Verified Safe MCPs & Zero Hardcoded Secrets in mcp.json',
    passed: mcpIssues.length === 0,
    details:
      mcpIssues.length === 0
        ? [`Verified ${detected.mcpsConfigured.length} configured MCP server(s) cleanly.`]
        : mcpIssues,
  });

  // 4. NX Monorepo Boundaries & Cross-Package Relative Imports Check
  const boundaryIssues: string[] = [];
  const sourceFiles = allFiles.filter(
    (f) =>
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.includes('__tests__') &&
      !f.includes('/tests/'),
  );
  for (const f of sourceFiles) {
    const rel = path.relative(targetDir, f);
    if (!rel.startsWith('apps/') && !rel.startsWith('packages/')) continue;
    const content = await fs.readFile(f, 'utf-8');
    if (/from\s+['"](?:\.\.\/)+packages\//.test(content)) {
      boundaryIssues.push(
        `${rel}: Forbidden cross-package relative import (use scoped package name)`,
      );
    }
    if (rel.startsWith('packages/') && /from\s+['"](?:\.\.\/)+apps\//.test(content)) {
      boundaryIssues.push(`${rel}: Package must never import from apps/*`);
    }
  }
  checks.push({
    id: 'monorepo-boundaries',
    name: 'NX Monorepo & UI Package Separation Boundaries',
    passed: boundaryIssues.length === 0,
    details:
      boundaryIssues.length === 0
        ? ['Zero cross-package relative imports or inverted package->app dependencies.']
        : boundaryIssues,
  });

  // 5. Test Placement Pyramid Check (__tests__/ for unit/integration, tests/e2e/ for E2E)
  const testIssues: string[] = [];
  for (const rel of relFiles) {
    if (!/\.test\.tsx?$|\.spec\.tsx?$/.test(rel)) continue;
    const isE2e = rel.includes('/tests/e2e/') || rel.startsWith('tests/e2e/');
    const isInDedicatedTests = rel.includes('/__tests__/');
    if (!isE2e && !isInDedicatedTests) {
      testIssues.push(
        `${rel}: Unit/integration test must be placed inside a __tests__/ folder (only E2E belongs in tests/e2e/)`,
      );
    }
  }
  checks.push({
    id: 'test-placement-pyramid',
    name: 'Test Pyramid Placement (__tests__/ for Unit/Integration, tests/e2e/ for E2E)',
    passed: testIssues.length === 0,
    details:
      testIssues.length === 0
        ? ['All unit, integration, and E2E tests follow exact folder placement rules.']
        : testIssues,
  });

  // 6. Anti-Doc-Sprawl & Concise AI Rules Check
  const docIssues: string[] = [];
  for (const rel of relFiles) {
    const base = path.basename(rel);
    if (!rel.includes('/') && FORBIDDEN_DOC_PATTERNS.some((rx) => rx.test(base))) {
      docIssues.push(`${rel}: Throwaway/duplicate root markdown file violates ai-docs-discipline`);
    }
    if (rel.startsWith('.ai/rules/') && rel.endsWith('.md')) {
      const lines = (await fs.readFile(path.join(targetDir, rel), 'utf-8')).split('\n').length;
      if (lines > 80) {
        docIssues.push(`${rel}: Rule has ${lines} lines (keep concise under 80 lines)`);
      }
    }
  }
  checks.push({
    id: 'ai-docs-discipline',
    name: 'Anti-Doc-Sprawl & Concise AI Rules Hygiene',
    passed: docIssues.length === 0,
    details:
      docIssues.length === 0
        ? ['Zero throwaway docs and all active .ai/rules/*.md files are concise (<80 lines).']
        : docIssues,
  });

  // 7. React Ink & Next.js Anti-Patterns Static Check
  const fwIssues: string[] = [];
  for (const f of sourceFiles) {
    const rel = path.relative(targetDir, f);
    const content = await fs.readFile(f, 'utf-8');
    if (rel.includes('/src/ui/')) {
      if (content.includes("from 'ink-select-input'") || content.includes("from 'ink-spinner'")) {
        fwIssues.push(`${rel}: Use @inkjs/ui via packages/ui-cli instead of legacy Ink wrappers`);
      }
      if (/\bconsole\.log\s*\(/.test(content)) {
        fwIssues.push(`${rel}: Avoid raw console.log() inside active React Ink TUI components`);
      }
    }
    if (rel.endsWith('apps/web/src/app/layout.tsx')) {
      if (!content.includes('suppressHydrationWarning')) {
        fwIssues.push(
          `${rel}: Missing suppressHydrationWarning on <html> for dark/light theme toggle`,
        );
      }
      if (!content.includes('metadataBase')) {
        fwIssues.push(`${rel}: Missing metadataBase in Next.js root layout metadata`);
      }
    }
  }
  checks.push({
    id: 'framework-anti-patterns',
    name: 'React Ink (@inkjs/ui) & Next.js Anti-Patterns Audit',
    passed: fwIssues.length === 0,
    details:
      fwIssues.length === 0 ? ['Zero React Ink or Next.js anti-patterns detected.'] : fwIssues,
  });

  // 8. Security Scanners Config & Code Secret Scan
  const secIssues: string[] = [];
  if (cfg?.stack.tools.includes('security-checker')) {
    if (!(await exists(path.join(targetDir, '.opengrep.yml')))) {
      secIssues.push('Missing .opengrep.yml security scanner config');
    }
    if (!(await exists(path.join(targetDir, '.gitleaks.toml')))) {
      secIssues.push('Missing .gitleaks.toml secret scanner config');
    }
  }
  for (const f of sourceFiles) {
    const rel = path.relative(targetDir, f);
    const content = await fs.readFile(f, 'utf-8');
    // Strip single/double/backtick string literals and line comments before checking executable eval()
    const stripped = content.replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
    if (/(?:^|[^\w$.])eval\s*\(/.test(stripped)) {
      secIssues.push(`${rel}: Forbidden eval() call detected`);
    }
    if (SECRET_REGEX.test(content)) {
      secIssues.push(`${rel}: Potential hardcoded secret literal detected`);
    }
  }
  checks.push({
    id: 'security-audit',
    name: 'Security Scanners (.opengrep.yml / .gitleaks.toml) & Secret/Eval Guard',
    passed: secIssues.length === 0,
    details:
      secIssues.length === 0
        ? ['Security scanner configs verified; zero eval() or hardcoded secrets found.']
        : secIssues,
  });

  const failedChecks = checks.filter((c) => !c.passed).length;
  return {
    targetDir,
    passed: failedChecks === 0,
    totalChecks: checks.length,
    failedChecks,
    checks,
  };
}
