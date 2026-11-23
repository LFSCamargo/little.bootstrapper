import fs from 'node:fs/promises';
import path from 'node:path';
import { MARKETPLACE_RULES, searchMarketplaceRules } from '../modules/catalog/index.js';
import { installMarketplaceRules, loadBootstrapConfig } from '../modules/generators/index.js';
import { RulesInstallArgsSchema, formatZodError } from '../modules/validation/index.js';
import { getFlagValue, hasFlag, type ParsedArgs } from './args.js';

export async function runRulesCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const { rawArgs, cwd } = parsed;

  if (hasFlag(rawArgs, '--list')) {
    console.log(
      JSON.stringify(
        MARKETPLACE_RULES.map(({ body: _body, ...meta }) => meta),
        null,
        2,
      ),
    );
    return { handled: true, exitCode: 0 };
  }

  const searchQuery = getFlagValue(rawArgs, '--search');
  if (searchQuery !== undefined) {
    console.log(
      JSON.stringify(
        searchMarketplaceRules(searchQuery).map(({ body: _body, ...meta }) => meta),
        null,
        2,
      ),
    );
    return { handled: true, exitCode: 0 };
  }

  const installRaw = getFlagValue(rawArgs, '--install');
  if (installRaw !== undefined) {
    const rawIds = installRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const validated = RulesInstallArgsSchema.safeParse({ ids: rawIds });
    if (!validated.success) {
      console.error('Invalid rule selection for `rules --install`:');
      console.error(formatZodError(validated.error));
      return { handled: true, exitCode: 1 };
    }

    const cfg = await loadBootstrapConfig(cwd);
    const created = await installMarketplaceRules(cwd, validated.data.ids, cfg ?? undefined);

    if (cfg) {
      cfg.stack.rules = Array.from(new Set([...(cfg.stack.rules ?? []), ...validated.data.ids]));
      await fs.writeFile(
        path.join(cwd, 'bootstrap.config.json'),
        `${JSON.stringify(cfg, null, 2)}\n`,
        'utf-8',
      );
    }

    console.log(
      `Good news, everyone! Installed ${validated.data.ids.length} marketplace rule(s) → ${created.join(', ')}`,
    );
    return { handled: true, exitCode: 0 };
  }

  return { handled: false, exitCode: 0 };
}
