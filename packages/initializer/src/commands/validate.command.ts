import { validateProjectPatterns } from '../modules/workflows/index.js';
import { hasFlag, type ParsedArgs } from './args.js';

export async function runValidateCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const report = await validateProjectPatterns(parsed.cwd);

  if (hasFlag(parsed.rawArgs, '--json')) {
    console.log(JSON.stringify(report, null, 2));
    return { handled: true, exitCode: report.passed ? 0 : 1 };
  }

  console.log(`\n🛡️  Planet Express Pattern Validation Report (${report.totalChecks} checks)\n`);
  for (const check of report.checks) {
    const icon = check.passed ? '✔' : '✖';
    console.log(`${icon} [${check.id}] ${check.name}`);
    for (const detail of check.details) {
      console.log(`    ${check.passed ? '•' : '!'} ${detail}`);
    }
  }
  console.log('');
  if (report.passed) {
    console.log('Good news, everyone! All repository patterns & security rules passed.');
  } else {
    console.error(
      `Pattern validation failed: ${report.failedChecks}/${report.totalChecks} check(s) violated.`,
    );
  }
  return { handled: true, exitCode: report.passed ? 0 : 1 };
}
