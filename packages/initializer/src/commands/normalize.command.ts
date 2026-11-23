import { ADDITIONAL_TOOLS, AI_AGENTS } from '../modules/catalog/index.js';
import { applyNormalization, detectCurrentSetup } from '../modules/workflows/index.js';
import { NormalizeCommandArgsSchema, formatZodError } from '../modules/validation/index.js';
import { getFlagValue, hasFlag, type ParsedArgs } from './args.js';

export async function runNormalizeCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const { rawArgs, cwd } = parsed;
  if (!hasFlag(rawArgs, '--check', '--apply')) {
    return { handled: false, exitCode: 0 };
  }

  if (hasFlag(rawArgs, '--check')) {
    const detected = await detectCurrentSetup(cwd);
    console.log(JSON.stringify(detected, null, 2));
    return { handled: true, exitCode: 0 };
  }

  const rawAgent = getFlagValue(rawArgs, '--agent') ?? 'claude';
  const mcpsRaw = getFlagValue(rawArgs, '--mcps');
  const rawMcps = mcpsRaw
    ? mcpsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const validated = NormalizeCommandArgsSchema.safeParse({
    agent: rawAgent,
    ...(rawMcps ? { mcps: rawMcps } : {}),
  });

  if (!validated.success) {
    console.error('Invalid arguments for `normalize`:');
    console.error(formatZodError(validated.error));
    return { handled: true, exitCode: 1 };
  }

  const defaultTools = ADDITIONAL_TOOLS.map((t) => t.id).filter((id) => id !== 'financial-audit');
  const res = await applyNormalization(
    cwd,
    AI_AGENTS.map((a) => a.id),
    defaultTools,
    validated.data.agent,
    validated.data.mcps,
  );
  console.log(
    `Normalized repository using agent "${res.normalizingAgent}" — synced ${res.filesUpdated.length} files.`,
  );
  return { handled: true, exitCode: 0 };
}
