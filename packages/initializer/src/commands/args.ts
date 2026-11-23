import path from 'node:path';

export interface ParsedArgs {
  command: string | undefined;
  rawArgs: string[];
  cwd: string;
}

export function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

export function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some((f) => args.includes(f));
}

export function parseCliArgs(argv: string[], defaultCwd = process.cwd()): ParsedArgs {
  const dirFlag = getFlagValue(argv, '--dir');
  return {
    command: argv[0],
    rawArgs: argv,
    cwd: dirFlag ? path.resolve(dirFlag) : defaultCwd,
  };
}
