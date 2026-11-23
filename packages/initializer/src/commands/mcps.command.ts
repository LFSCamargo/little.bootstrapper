import fs from 'node:fs/promises';
import path from 'node:path';
import {
  AI_AGENTS,
  DEFAULT_VERIFIED_MCPS,
  VERIFIED_MCPS,
  getVerifiedMcpById,
  recommendMcpsForProject,
  searchVerifiedMcps,
} from '../modules/catalog/index.js';
import { generateMcpConfig, loadBootstrapConfig } from '../modules/generators/index.js';
import { McpsInstallArgsSchema, formatZodError } from '../modules/validation/index.js';
import { getFlagValue, hasFlag, type ParsedArgs } from './args.js';

export async function runMcpsCommand(
  parsed: ParsedArgs,
): Promise<{ handled: boolean; exitCode: number }> {
  const { rawArgs, cwd } = parsed;

  if (hasFlag(rawArgs, '--list')) {
    console.log(JSON.stringify(VERIFIED_MCPS, null, 2));
    return { handled: true, exitCode: 0 };
  }

  if (hasFlag(rawArgs, '--recommend')) {
    const cfg = await loadBootstrapConfig(cwd);
    const ids = cfg ? recommendMcpsForProject(cfg) : DEFAULT_VERIFIED_MCPS;
    const recommended = ids
      .map((id) => getVerifiedMcpById(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    console.log(JSON.stringify(recommended, null, 2));
    return { handled: true, exitCode: 0 };
  }

  const searchQuery = getFlagValue(rawArgs, '--search');
  if (searchQuery !== undefined) {
    console.log(JSON.stringify(searchVerifiedMcps(searchQuery), null, 2));
    return { handled: true, exitCode: 0 };
  }

  const installRaw = getFlagValue(rawArgs, '--install');
  if (installRaw !== undefined) {
    const rawIds = installRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const validated = McpsInstallArgsSchema.safeParse({ ids: rawIds });
    if (!validated.success) {
      console.error('Invalid MCP server selection for `mcps --install`:');
      console.error(formatZodError(validated.error));
      return { handled: true, exitCode: 1 };
    }

    const cfg = await loadBootstrapConfig(cwd);
    const agents = cfg?.stack.agents ?? AI_AGENTS.map((a) => a.id);
    const res = await generateMcpConfig(cwd, validated.data.ids, agents);

    if (cfg) {
      cfg.stack.mcps = Array.from(new Set([...(cfg.stack.mcps ?? []), ...res.installedMcps]));
      await fs.writeFile(
        path.join(cwd, 'bootstrap.config.json'),
        `${JSON.stringify(cfg, null, 2)}\n`,
        'utf-8',
      );
    }

    console.log(
      `Good news, everyone! Installed ${res.installedMcps.length} verified MCP(s) (${res.installedMcps.join(', ')}) → ${res.filesWritten.join(', ')}`,
    );
    return { handled: true, exitCode: 0 };
  }

  return { handled: false, exitCode: 0 };
}
