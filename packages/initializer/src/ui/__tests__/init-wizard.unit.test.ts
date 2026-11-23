import React from 'react';
import { PassThrough } from 'node:stream';
import { render } from 'ink';
import { describe, it, expect } from 'vitest';
import { PlanetThemeProvider } from '@little-bootstrapper/ui-cli';
import { InitWizardScreen } from '../screens/InitWizardScreen.js';

function createInteractiveStreams() {
  const stdout = new PassThrough() as PassThrough & { columns?: number; rows?: number };
  stdout.columns = 120;
  stdout.rows = 40;
  const chunks: string[] = [];
  stdout.on('data', (chunk: Buffer | string) => {
    chunks.push(chunk.toString());
  });

  const stdin = new PassThrough() as PassThrough & {
    isTTY?: boolean;
    setRawMode?: (mode: boolean) => typeof stdin;
    ref?: () => typeof stdin;
    unref?: () => typeof stdin;
  };
  stdin.isTTY = true;
  stdin.setRawMode = () => stdin;
  stdin.ref = () => stdin;
  stdin.unref = () => stdin;

  return {
    stdout,
    stdin,
    getOutput: () => chunks.join(''),
  };
}

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms));

async function waitForOutput(getOutput: () => string, needle: string, timeoutMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getOutput().includes(needle)) return;
    await tick(15);
  }
  expect(getOutput()).toContain(needle);
}

describe('InitWizardScreen interactive flow (regression)', () => {
  it('proceeds past package-manager, monorepo, and all default Select steps when pressing Enter', async () => {
    const { stdout, stdin, getOutput } = createInteractiveStreams();

    const instance = render(
      React.createElement(
        PlanetThemeProvider,
        null,
        React.createElement(InitWizardScreen, {
          cwd: '/tmp',
          onBackToMenu: () => undefined,
          onCompleted: () => undefined,
        }),
      ),
      {
        stdout: stdout as unknown as NodeJS.WriteStream,
        stdin: stdin as unknown as NodeJS.ReadStream,
        patchConsole: false,
      },
    );

    const press = async (key: string) => {
      stdin.write(key);
      await tick(20);
    };

    try {
      // 1. repo-name -> 2. description -> 3. author -> 4. codeowners -> 5. languages
      await waitForOutput(getOutput, 'Repo Name (no spaces):');
      await press('\r');
      await waitForOutput(getOutput, 'Description:');
      await press('\r');
      await waitForOutput(getOutput, 'GitHub Author Handle:');
      await press('\r');
      await waitForOutput(getOutput, 'Setup CODEOWNERS?');
      await press('\r');
      await waitForOutput(getOutput, 'Select Languages:');
      await press('\r');

      await waitForOutput(getOutput, 'JS/TS Package Manager:');

      // 6. package-manager: press Enter on default ('yarn') -> must proceed to root-linter
      await press('\r');
      await waitForOutput(getOutput, 'Root-Only Linter');

      // 7. root-linter: press Enter on default ('eslint') -> must proceed to monorepo
      await press('\r');
      await waitForOutput(getOutput, 'Is this a Monorepo (NX)?');

      // 8. monorepo: press Enter on default ('yes') -> must proceed to frameworks
      await press('\r');
      await waitForOutput(getOutput, 'Select Frameworks, Design Systems, CSS, Testing');

      // 9. frameworks -> 10. domains -> 11. tools -> 12. agents -> 13. mcps
      await press('\r');
      await waitForOutput(getOutput, 'Select Project Domains');
      await press('\r');
      await waitForOutput(getOutput, 'Select Additional Tools');
      await press('\r');
      await waitForOutput(getOutput, 'Select Universal AI Agents:');
      await press('\r');
      await waitForOutput(getOutput, 'Select Verified Safe MCP Servers');
      await press('\r');

      await waitForOutput(getOutput, 'Workspace Applications & Packages');
      expect(getOutput()).toContain('apps/api');
      expect(getOutput()).toContain('apps/web');
      expect(getOutput()).toContain('packages/contracts');

      // 14. apps-packages: press Enter on first option ("Continue to Architecture Selector")
      await press('\r');

      await waitForOutput(getOutput, 'Architecture Pattern:');

      // 14. arch-pattern -> 15. folder-org -> 16. file-naming -> 17. test-org (all defaultValue Selects)
      await press('\r');
      await waitForOutput(getOutput, 'Folder Organization');

      await press('\r');
      await waitForOutput(getOutput, 'File Naming Convention:');

      await press('\r');
      await waitForOutput(getOutput, 'Test File Organization:');

      await press('\r');
      await waitForOutput(getOutput, 'Enable test coverage threshold enforcement');

      // 18. coverage-enabled -> 19. coverage-threshold -> 20. arch-options -> 21. preview
      await press('\r');
      await waitForOutput(getOutput, 'Minimum Coverage Threshold');
      await press('\r');
      await waitForOutput(getOutput, 'Architecture Additional Options:');
      await press('\r');

      await waitForOutput(getOutput, 'Form Responses & Project Setup');
      expect(getOutput()).toContain('Confirm & Launch little.bootstrapper Delivery!');
    } finally {
      instance.unmount();
    }
  });
});
