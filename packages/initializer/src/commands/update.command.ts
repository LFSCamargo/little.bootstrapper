import { applyAuditedVersionUpdates, auditProjectVersions } from '../modules/workflows/index.js';
import { hasFlag, type ParsedArgs } from './args.js';

export async function runUpdateCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const { rawArgs, cwd } = parsed;
  if (!hasFlag(rawArgs, '--check', '--apply')) {
    return { handled: false, exitCode: 0 };
  }

  const items = await auditProjectVersions(cwd);
  const actionable = items.filter((i) => i.needsUpdate);

  if (hasFlag(rawArgs, '--check')) {
    console.log(
      JSON.stringify(
        { total: items.length, actionable: actionable.length, items: actionable },
        null,
        2,
      ),
    );
    return { handled: true, exitCode: 0 };
  }

  const updated = await applyAuditedVersionUpdates(cwd);
  console.log(
    `Audited ${items.length} dependencies; updated ${updated} to pinned audited versions.`,
  );
  return { handled: true, exitCode: 0 };
}
