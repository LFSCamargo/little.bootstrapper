import { PLANET_EXPRESS_SHIP_ASCII } from '../assets/ascii/index.js';
import type { ParsedArgs } from './args.js';

export const CLI_VERSION = '1.0.0';

export function runHelpCommand(parsed: ParsedArgs): { handled: boolean; exitCode: number } {
  const { command } = parsed;

  if (command === '--help' || command === '-h') {
    console.log(PLANET_EXPRESS_SHIP_ASCII);
    console.log(
      `\nPlanet Express Universal AI Agent Initializer (little.bootstrapper v${CLI_VERSION})\n`,
    );
    console.log('Usage: little-bootstrapper [command] [options]\n');
    console.log('Commands:');
    console.log(
      '  init [--yes] [--name <n>] [--domains <d>] [--no-coverage] [--coverage-threshold <0-100>] [--out <dir>]',
    );
    console.log(
      '                                                          Initialize Setup (CORE) + rules & coverage',
    );
    console.log(
      '  rules [--list] [--search <q>] [--install <ids>] [--dir] Rules Marketplace (framework, language, financial)',
    );
    console.log(
      '  mcps [--list] [--recommend] [--search <q>] [--install]  Verified Safe MCP Marketplace (26 audited MCPs)',
    );
    console.log(
      '  normalize [--apply] [--agent <a>] [--dir <dir>]         Normalize Existing Setup (AI agents/tools/MCPs)',
    );
    console.log(
      '  update [--apply] [--dir <dir>]                          Update Helper (audit, flag CVEs & pin versions)',
    );
    console.log(
      '  validate [--json] [--dir <dir>]                         PR Pattern Gate (audit all rules, deps, MCPs & tests)',
    );
    console.log(
      '  generate <name> [--dir <dir>]                           Generate a new module using bootstrap.config.json',
    );
    return { handled: true, exitCode: 0 };
  }

  if (command === '--version' || command === '-v') {
    console.log(CLI_VERSION);
    return { handled: true, exitCode: 0 };
  }

  return { handled: false, exitCode: 0 };
}
