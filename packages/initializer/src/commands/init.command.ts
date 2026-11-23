import path from 'node:path';
import type { BootstrapConfig } from '../types/index.js';
import { ADDITIONAL_TOOLS, AI_AGENTS, DEFAULT_VERIFIED_MCPS } from '../modules/catalog/index.js';
import { generateProject } from '../modules/generators/index.js';
import {
  BootstrapConfigSchema,
  InitCommandArgsSchema,
  formatZodError,
} from '../modules/validation/index.js';
import { BENDER_MASCOT_ASCII } from '../assets/ascii/index.js';
import { getFlagValue, hasFlag, type ParsedArgs } from './args.js';

export async function runInitCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const { rawArgs, cwd } = parsed;
  if (!hasFlag(rawArgs, '--yes')) {
    return { handled: false, exitCode: 0 };
  }

  const rawName = getFlagValue(rawArgs, '--name') ?? 'planet-express-app';
  const outFlag = getFlagValue(rawArgs, '--out');
  const rawLanguages = (getFlagValue(rawArgs, '--languages') ?? 'typescript')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const rawPm = getFlagValue(rawArgs, '--pm') ?? 'yarn';
  const rawLinter = getFlagValue(rawArgs, '--linter') ?? 'eslint';
  const rawFrameworks = (
    getFlagValue(rawArgs, '--frameworks') ??
    'hono,ink,nextjs,react-native,vitest,playwright,shadcn,aceternity-ui'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const mcpsRaw = getFlagValue(rawArgs, '--mcps');
  const rawMcps = mcpsRaw
    ? mcpsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_VERIFIED_MCPS;
  const domainsRaw = getFlagValue(rawArgs, '--domains');
  const rawDomains = domainsRaw
    ? domainsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['general'];
  const rulesRaw = getFlagValue(rawArgs, '--rules');
  const rawRules = rulesRaw
    ? rulesRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const coverageEnabled = !hasFlag(rawArgs, '--no-coverage');
  const rawCoverageThreshold = getFlagValue(rawArgs, '--coverage-threshold');

  const validated = InitCommandArgsSchema.safeParse({
    name: rawName,
    description: getFlagValue(rawArgs, '--description') ?? 'Bootstrapped with little.bootstrapper',
    author: getFlagValue(rawArgs, '--author') ?? 'fry',
    codeowners: !hasFlag(rawArgs, '--no-codeowners'),
    monorepo: !hasFlag(rawArgs, '--no-monorepo'),
    languages: rawLanguages,
    packageManager: rawPm,
    linter: rawLinter,
    prettier: true,
    frameworks: rawFrameworks,
    mcps: rawMcps,
    domains: rawDomains,
    ...(rawRules ? { rules: rawRules } : {}),
    coverageEnabled,
    ...(rawCoverageThreshold !== undefined ? { coverageThreshold: rawCoverageThreshold } : {}),
    outDir: outFlag ? path.resolve(outFlag) : path.join(cwd, rawName),
  });

  if (!validated.success) {
    console.error('Invalid arguments for `init`:');
    console.error(formatZodError(validated.error));
    return { handled: true, exitCode: 1 };
  }

  const args = validated.data;
  const config: BootstrapConfig = BootstrapConfigSchema.parse({
    version: '1.0.0',
    project: {
      name: args.name,
      description: args.description,
      author: args.author,
      codeowners: args.codeowners,
    },
    stack: {
      languages: args.languages,
      packageManager: args.packageManager,
      monorepo: args.monorepo,
      useMakefiles: args.languages.some((l) => l !== 'typescript'),
      linter: args.linter ?? 'eslint',
      prettier: args.prettier ?? true,
      frameworks: args.frameworks,
      tools: ADDITIONAL_TOOLS.map((t) => t.id),
      agents: AI_AGENTS.map((a) => a.id),
      mcps: args.mcps,
      domains: args.domains ?? ['general'],
      ...(args.rules ? { rules: args.rules } : {}),
    },
    workspace: {
      apps: [
        {
          name: 'api',
          language: 'typescript',
          framework:
            args.packageManager === 'bun' && args.frameworks.includes('elysia') ? 'elysia' : 'hono',
          kind: 'backend',
        },
        { name: 'web', language: 'typescript', framework: 'nextjs', kind: 'web' },
      ],
      packages: [
        { name: 'contracts', language: 'typescript', framework: 'vitest', kind: 'contracts' },
      ],
    },
    architecture: {
      pattern: 'modular',
      folderOrganization: 'module-based',
      fileNaming: 'kebab-case',
      testOrganization: 'dedicated-tests',
      strictBoundaries: true,
      pathAliases: true,
      barrelExports: true,
      exampleModule: true,
    },
    testing: {
      coverage: {
        enabled: args.coverageEnabled,
        threshold: args.coverageThreshold,
      },
    },
  });

  const res = await generateProject(args.outDir, config);
  console.log(BENDER_MASCOT_ASCII);
  const coverageSummary = args.coverageEnabled
    ? `enabled (${args.coverageThreshold}%)`
    : 'disabled';
  console.log(
    `Good news, everyone! Initialized "${args.name}" (${res.filesCreated.length} files, UI packages: ${res.uiPackagesCreated.join(', ')}, MCPs: ${args.mcps.join(', ')}, coverage: ${coverageSummary}) at ${res.targetDir}`,
  );
  return { handled: true, exitCode: 0 };
}
