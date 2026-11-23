import { generateModule, loadBootstrapConfig } from '../modules/generators/index.js';
import { GenerateCommandArgsSchema, formatZodError } from '../modules/validation/index.js';
import type { ParsedArgs } from './args.js';

export async function runGenerateCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const validated = GenerateCommandArgsSchema.safeParse({
    moduleName: parsed.rawArgs[1] ?? '',
  });

  if (!validated.success) {
    console.error('Invalid arguments for `generate <module-name>`:');
    console.error(formatZodError(validated.error));
    return { handled: true, exitCode: 1 };
  }

  const config = await loadBootstrapConfig(parsed.cwd);
  if (!config) {
    console.error('No valid bootstrap.config.json found in target directory.');
    return { handled: true, exitCode: 1 };
  }

  const files = await generateModule(parsed.cwd, validated.data.moduleName, config);
  console.log(`Good news, everyone! Generated module "${validated.data.moduleName}":`);
  for (const f of files) {
    console.log(`  + ${f}`);
  }
  return { handled: true, exitCode: 0 };
}
