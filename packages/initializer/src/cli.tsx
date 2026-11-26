#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { dispatchCommand } from './commands/index.js';
import { App } from './ui/App.js';

async function main() {
  const outcome = await dispatchCommand(process.argv.slice(2), process.cwd());
  if (outcome.kind === 'exit') {
    process.exit(outcome.exitCode);
  }

  if (!process.stdin.isTTY) {
    console.error(
      'Interactive TUI requires a TTY terminal. Use non-interactive flags (e.g. `init --yes`, `rules --list`, `mcps --list`, `normalize --check`, `update --check`, or `--help`).',
    );
    process.exit(1);
  }

  render(<App initialMode={outcome.mode} cwd={outcome.cwd} />);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
