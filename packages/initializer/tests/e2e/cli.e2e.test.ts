import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const CLI_BIN = path.resolve(import.meta.dirname, '../../dist/cli.js');

describe('little.bootstrapper CLI (E2E)', () => {
  it('renders exact SSt Futurama delivery ship ASCII art on --help and reports version', async () => {
    const help = await execFileAsync('node', [CLI_BIN, '--help']);
    expect(help.stdout).toContain('SSt');
    expect(help.stdout).toContain("(,;')");
    expect(help.stdout).toContain('init');
    expect(help.stdout).toContain('rules');
    expect(help.stdout).toContain('mcps');
    expect(help.stdout).toContain('normalize');
    expect(help.stdout).toContain('update');
    expect(help.stdout).toContain('validate');
    expect(help.stdout).toContain('generate');

    const ver = await execFileAsync('node', [CLI_BIN, '--version']);
    expect(ver.stdout.trim()).toBe('1.0.0');
  });

  it('executes full CLI lifecycle: init -> generate -> normalize -> update', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pe-cli-e2e-'));
    const projectDir = path.join(tmpRoot, 'nimbus-express');

    try {
      // 1. Initialize Setup (CORE)
      const initRes = await execFileAsync('node', [
        CLI_BIN,
        'init',
        '--yes',
        '--name',
        'nimbus-express',
        '--author',
        'fry',
        '--languages',
        'typescript,golang',
        '--frameworks',
        'ink,nextjs,react-native,vitest,shadcn,aceternity-ui',
        '--out',
        projectDir,
      ]);
      expect(initRes.stdout).toContain('Silver Saks');
      expect(initRes.stdout).toContain('ui-cli, ui-web, ui-mobile');

      // Verify separated UI packages & universal agents exist on disk
      await expect(
        fs.access(path.join(projectDir, 'packages/ui-cli/package.json')),
      ).resolves.toBeUndefined();
      const uiCliPkg = JSON.parse(
        await fs.readFile(path.join(projectDir, 'packages/ui-cli/package.json'), 'utf-8'),
      ) as { dependencies: Record<string, string> };
      expect(uiCliPkg.dependencies['@inkjs/ui']).toBe('2.0.0');
      await expect(
        fs.access(path.join(projectDir, 'packages/ui-web/components.json')),
      ).resolves.toBeUndefined();
      await expect(
        fs.access(path.join(projectDir, 'packages/ui-mobile/package.json')),
      ).resolves.toBeUndefined();
      await expect(fs.access(path.join(projectDir, 'AGENTS.md'))).resolves.toBeUndefined();
      await expect(fs.access(path.join(projectDir, 'CLAUDE.md'))).resolves.toBeUndefined();
      await expect(
        fs.access(path.join(projectDir, '.agent/rules/universal.md')),
      ).resolves.toBeUndefined();
      await expect(
        fs.access(path.join(projectDir, '.cursor/rules/universal.mdc')),
      ).resolves.toBeUndefined();
      await expect(fs.access(path.join(projectDir, 'Makefile'))).resolves.toBeUndefined();
      const defaultMake = await execFileAsync('make', ['-n'], { cwd: projectDir });
      expect(defaultMake.stdout).toContain('for test');
      expect(defaultMake.stdout).not.toContain('go build');
      await expect(fs.access(path.join(projectDir, 'mcp.json'))).resolves.toBeUndefined();

      // 1b. Browse, Search & Install Verified Safe MCPs via CLI
      const listMcps = await execFileAsync('node', [CLI_BIN, 'mcps', '--list']);
      const allMcps = JSON.parse(listMcps.stdout) as { id: string }[];
      expect(allMcps.length).toBeGreaterThanOrEqual(26);

      const recMcps = await execFileAsync('node', [
        CLI_BIN,
        'mcps',
        '--recommend',
        '--dir',
        projectDir,
      ]);
      const recommended = JSON.parse(recMcps.stdout) as { id: string }[];
      expect(recommended.map((m) => m.id)).toEqual(
        expect.arrayContaining(['ai-memory', 'context7', 'nx', 'nextjs-devtools', 'shadcn']),
      );

      const searchMcps = await execFileAsync('node', [CLI_BIN, 'mcps', '--search', 'postgres']);
      const pgMcps = JSON.parse(searchMcps.stdout) as { id: string }[];
      expect(pgMcps.some((m) => m.id === 'postgres')).toBe(true);

      const installMcps = await execFileAsync('node', [
        CLI_BIN,
        'mcps',
        '--install',
        'github,postgres',
        '--dir',
        projectDir,
      ]);
      expect(installMcps.stdout).toContain('mcp.json');

      // 1c. Browse, Search & Install Rules from the Rules Marketplace
      const searchRules = await execFileAsync('node', [CLI_BIN, 'rules', '--search', 'financial']);
      const finRules = JSON.parse(searchRules.stdout) as { id: string }[];
      expect(finRules.some((r) => r.id === 'financial-rules')).toBe(true);

      const installRules = await execFileAsync('node', [
        CLI_BIN,
        'rules',
        '--install',
        'financial-rules',
        '--dir',
        projectDir,
      ]);
      expect(installRules.stdout).toContain('financial-rules.md');
      await expect(
        fs.access(path.join(projectDir, '.ai/rules/financial-rules.md')),
      ).resolves.toBeUndefined();
      const mcpRaw = JSON.parse(await fs.readFile(path.join(projectDir, 'mcp.json'), 'utf-8')) as {
        mcpServers: Record<string, unknown>;
      };
      expect(mcpRaw.mcpServers).toHaveProperty('github');
      expect(mcpRaw.mcpServers).toHaveProperty('postgres');
      expect(mcpRaw.mcpServers).toHaveProperty('context7');

      // 2. Generate Module following persisted bootstrap.config.json
      const genRes = await execFileAsync('node', [
        CLI_BIN,
        'generate',
        'dark-matter-engine',
        '--dir',
        projectDir,
      ]);
      expect(genRes.stdout).toContain('dark-matter-engine');
      await expect(
        fs.access(path.join(projectDir, 'src/modules/dark-matter-engine/dark-matter-engine.ts')),
      ).resolves.toBeUndefined();

      // 3. Normalize Existing Setup (remove a rule/skill and re-sync via cursor agent)
      await fs.rm(path.join(projectDir, '.ai/skills/spaghetti-checker'), {
        recursive: true,
        force: true,
      });
      const checkNorm = await execFileAsync('node', [
        CLI_BIN,
        'normalize',
        '--check',
        '--dir',
        projectDir,
      ]);
      const detected = JSON.parse(checkNorm.stdout) as { missingTools: string[] };
      expect(detected.missingTools).toContain('spaghetti-checker');

      const applyNorm = await execFileAsync('node', [
        CLI_BIN,
        'normalize',
        '--agent',
        'cursor',
        '--apply',
        '--dir',
        projectDir,
      ]);
      expect(applyNorm.stdout).toContain('cursor');
      await expect(
        fs.access(path.join(projectDir, '.ai/skills/spaghetti-checker/SKILL.md')),
      ).resolves.toBeUndefined();

      // 4. Update Helper (inject unpinned + vulnerable package, check, then apply)
      const pkgPath = path.join(projectDir, 'package.json');
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8')) as {
        dependencies?: Record<string, string>;
        devDependencies: Record<string, string>;
      };
      pkg.dependencies = { next: '15.3.2' };
      pkg.devDependencies.typescript = '^5.1.0';
      await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');

      const checkUpd = await execFileAsync('node', [
        CLI_BIN,
        'update',
        '--check',
        '--dir',
        projectDir,
      ]);
      const auditReport = JSON.parse(checkUpd.stdout) as {
        actionable: number;
        items: { packageName: string; status: string }[];
      };
      expect(auditReport.actionable).toBeGreaterThanOrEqual(2);
      expect(
        auditReport.items.some((i) => i.packageName === 'next' && i.status === 'vulnerable'),
      ).toBe(true);

      const applyUpd = await execFileAsync('node', [
        CLI_BIN,
        'update',
        '--apply',
        '--dir',
        projectDir,
      ]);
      expect(applyUpd.stdout).toContain('updated');

      const updatedPkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8')) as {
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
      };
      expect(updatedPkg.dependencies.next).toBe('15.5.29');
      expect(updatedPkg.devDependencies.typescript).toBe('5.8.3');

      // 5. Pattern Validation Gate (`validate --json`) passes cleanly on the bootstrapped & updated project
      const validateRes = await execFileAsync('node', [
        CLI_BIN,
        'validate',
        '--json',
        '--dir',
        projectDir,
      ]);
      const valReport = JSON.parse(validateRes.stdout) as { passed: boolean; totalChecks: number };
      expect(valReport.passed).toBe(true);
      expect(valReport.totalChecks).toBe(8);
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });

  it('rejects invalid CLI arguments via Zod validation with exit code 1 and readable errors', async () => {
    await expect(
      execFileAsync('node', [CLI_BIN, 'init', '--yes', '--name', 'invalid repo name']),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('must not contain spaces'),
    });

    await expect(
      execFileAsync('node', [CLI_BIN, 'init', '--yes', '--pm', 'yarn', '--frameworks', 'elysia']),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('elysia'),
    });

    await expect(
      execFileAsync('node', [CLI_BIN, 'mcps', '--install', 'unverified-rogue-mcp']),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('Invalid MCP server selection'),
    });

    await expect(
      execFileAsync('node', [CLI_BIN, 'normalize', '--apply', '--agent', 'invalid-agent']),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('Invalid arguments for `normalize`'),
    });
  });
});
