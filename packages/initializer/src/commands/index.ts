import { parseCliArgs, type ParsedArgs } from './args.js';
import { runHelpCommand } from './help.command.js';
import { runInitCommand } from './init.command.js';
import { runRulesCommand } from './rules.command.js';
import { runMcpsCommand } from './mcps.command.js';
import { runNormalizeCommand } from './normalize.command.js';
import { runUpdateCommand } from './update.command.js';
import { runValidateCommand } from './validate.command.js';
import { runGenerateCommand } from './generate.command.js';

export type InteractiveMode = 'menu' | 'init' | 'rules' | 'mcps' | 'normalize' | 'update';

export type DispatchOutcome =
  | { kind: 'exit'; exitCode: number }
  | { kind: 'interactive'; mode: InteractiveMode; cwd: string };

const INTERACTIVE_MODES: Record<string, InteractiveMode> = {
  init: 'init',
  rules: 'rules',
  mcps: 'mcps',
  normalize: 'normalize',
  update: 'update',
};

export async function dispatchCommand(
  argv: string[],
  defaultCwd = process.cwd(),
): Promise<DispatchOutcome> {
  const parsed: ParsedArgs = parseCliArgs(argv, defaultCwd);

  const helpRes = runHelpCommand(parsed);
  if (helpRes.handled) {
    return { kind: 'exit', exitCode: helpRes.exitCode };
  }

  if (parsed.command === 'init') {
    const res = await runInitCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  } else if (parsed.command === 'rules') {
    const res = await runRulesCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  } else if (parsed.command === 'mcps') {
    const res = await runMcpsCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  } else if (parsed.command === 'normalize') {
    const res = await runNormalizeCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  } else if (parsed.command === 'update') {
    const res = await runUpdateCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  } else if (parsed.command === 'validate') {
    const res = await runValidateCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  } else if (parsed.command === 'generate') {
    const res = await runGenerateCommand(parsed);
    if (res.handled) return { kind: 'exit', exitCode: res.exitCode };
  }

  const mode: InteractiveMode = (parsed.command && INTERACTIVE_MODES[parsed.command]) || 'menu';
  return { kind: 'interactive', mode, cwd: parsed.cwd };
}

export * from './args.js';
export * from './help.command.js';
export * from './init.command.js';
export * from './rules.command.js';
export * from './mcps.command.js';
export * from './normalize.command.js';
export * from './update.command.js';
export * from './validate.command.js';
export * from './generate.command.js';
