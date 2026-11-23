import React from 'react';
import { PassThrough } from 'node:stream';
import { render } from 'ink';
import { describe, it, expect } from 'vitest';
import {
  PLANET_EXPRESS_SHIP_ASCII,
  BENDER_MASCOT_ASCII,
  FUTURAMA_QUOTES,
  getRandomQuote,
  PlanetBanner,
  BenderCard,
  StepProgress,
  DeliveryLoader,
  PlanetThemeProvider,
  planetExpressTheme,
  MultiSelect,
  filterMultiSelectOptions,
  FolderPreview,
  StatusFooter,
  SummaryTable,
  MarkdownPanel,
  computeColumnWidths,
  Alert,
  Badge,
  ConfirmInput,
  ProgressBar,
  Select,
  Spinner,
  StatusMessage,
} from '../index.js';

function renderInkToString(element: React.ReactElement): string {
  const stdout = new PassThrough() as PassThrough & { columns?: number; rows?: number };
  stdout.columns = 100;
  stdout.rows = 40;
  const chunks: string[] = [];
  stdout.on('data', (chunk: Buffer | string) => {
    chunks.push(chunk.toString());
  });
  const instance = render(React.createElement(PlanetThemeProvider, null, element), {
    stdout: stdout as unknown as NodeJS.WriteStream,
    patchConsole: false,
  });
  instance.unmount();
  return chunks.join('');
}

describe('@little-bootstrapper/ui-cli (unit)', () => {
  it('contains the exact Planet Express Ship ASCII illustration from asciiart.website/art/4158 (SSt)', () => {
    expect(PLANET_EXPRESS_SHIP_ASCII).toContain('SSt');
    expect(PLANET_EXPRESS_SHIP_ASCII).toContain("(,;')");
    expect(PLANET_EXPRESS_SHIP_ASCII).toContain('__________');
    expect(PLANET_EXPRESS_SHIP_ASCII.split('\n')).toHaveLength(14);
  });

  it('contains the exact Bender Mascot ASCII illustration (Silver Saks)', () => {
    expect(BENDER_MASCOT_ASCII).toContain('Silver Saks');
    expect(BENDER_MASCOT_ASCII).toContain('@   @');
    expect(BENDER_MASCOT_ASCII).toContain('-+-+-+');
    expect(BENDER_MASCOT_ASCII.split('\n')).toHaveLength(18);
  });

  it('exports Futurama animated components and official @inkjs/ui primitives', () => {
    expect(FUTURAMA_QUOTES.length).toBeGreaterThanOrEqual(5);
    expect(FUTURAMA_QUOTES).toContain(getRandomQuote());
    expect(planetExpressTheme.components).toBeDefined();

    // Verify table column width calculation (including explicit width cap)
    const widths = computeColumnWidths(
      [
        { key: 'field', header: 'Field' },
        { key: 'value', header: 'Value', width: 10 },
      ],
      [{ field: 'Architecture', value: 'modular / kebab-case' }],
    );
    expect(widths).toEqual([12, 10]);

    // Official @inkjs/ui exports
    expect(typeof Alert).toBe('function');
    expect(typeof Badge).toBe('function');
    expect(typeof ConfirmInput).toBe('function');
    expect(typeof ProgressBar).toBe('function');
    expect(typeof Select).toBe('function');
    expect(typeof Spinner).toBe('function');
    expect(typeof StatusMessage).toBe('function');
  });

  it('filters searchable MultiSelect options by label, value, category, and hint', () => {
    const opts = [
      { label: 'Context7', value: 'context7', category: 'Docs', hint: 'Up-to-date library docs' },
      {
        label: 'Playwright',
        value: 'playwright',
        category: 'Browser',
        hint: 'Headless browser E2E',
      },
      {
        label: 'PostgreSQL',
        value: 'postgres',
        category: 'Database',
        hint: 'Read-only SQL queries',
      },
    ];
    expect(filterMultiSelectOptions(opts, '')).toHaveLength(3);
    expect(filterMultiSelectOptions(opts, 'browser').map((o) => o.value)).toEqual(['playwright']);
    expect(filterMultiSelectOptions(opts, 'sql').map((o) => o.value)).toEqual(['postgres']);
    expect(filterMultiSelectOptions(opts, 'CONTEXT7').map((o) => o.value)).toEqual(['context7']);
    expect(filterMultiSelectOptions(opts, 'nonexistent')).toHaveLength(0);
  });

  it('renders PlanetBanner, BenderCard, StepProgress, DeliveryLoader, FolderPreview, StatusFooter, SummaryTable, MarkdownPanel, and MultiSelect', () => {
    const bannerStatic = renderInkToString(
      React.createElement(PlanetBanner, { animated: false, subtitle: 'Custom Delivery' }),
    );
    expect(bannerStatic).toContain('SSt');
    expect(bannerStatic).toContain('Custom Delivery');

    const bannerAnimated = renderInkToString(React.createElement(PlanetBanner, { animated: true }));
    expect(bannerAnimated).toContain('PLANET EXPRESS');

    const bender = renderInkToString(
      React.createElement(BenderCard, {
        message: 'Created 10 files',
        quote: 'Bite my shiny metal scaffold!',
      }),
    );
    expect(bender).toContain('Silver Saks');
    expect(bender).toContain('Created 10 files');

    const benderDefault = renderInkToString(React.createElement(BenderCard, {}));
    expect(benderDefault).toContain('Silver Saks');

    const progress = renderInkToString(
      React.createElement(StepProgress, {
        workflow: 'INIT',
        stepName: 'coverage-threshold',
        currentStep: 19,
        totalSteps: 21,
      }),
    );
    expect(progress).toContain('INIT');
    expect(progress).toContain('19/21');

    const loader = renderInkToString(
      React.createElement(DeliveryLoader, { label: 'Launching ship...', stepIndex: 1 }),
    );
    expect(loader).toContain('Launching ship...');

    const preview = renderInkToString(
      React.createElement(FolderPreview, {
        title: 'Tree Preview',
        lines: ['app/', '  src/index.ts'],
      }),
    );
    expect(preview).toContain('Tree Preview');
    expect(preview).toContain('src/index.ts');

    const footer = renderInkToString(
      React.createElement(StatusFooter, {
        context: 'MENU',
        hints: [
          { key: 'Enter', action: 'Select' },
          { key: 'Esc', action: 'Back' },
        ],
      }),
    );
    expect(footer).toContain('MENU');
    expect(footer).toContain('Enter');

    const table = renderInkToString(
      React.createElement(SummaryTable, {
        title: 'Config',
        columns: [
          { key: 'k', header: 'Key', color: 'cyan' },
          { key: 'v', header: 'Value', width: 8 },
        ],
        rows: [{ k: 'Coverage', v: '75% enabled across all workspaces' }],
      }),
    );
    expect(table).toContain('Config');
    expect(table).toContain('Coverage');

    const emptyTable = renderInkToString(
      React.createElement(SummaryTable, {
        columns: [{ key: 'k', header: 'Key' }],
        rows: [],
      }),
    );
    expect(emptyTable).toContain('Key');

    const md = renderInkToString(
      React.createElement(MarkdownPanel, {
        title: 'Notes',
        markdown: '# Heading\n## Sub\n- Run `yarn test:coverage`\n\nPlain line with `code`',
      }),
    );
    expect(md).toContain('Heading');
    expect(md).toContain('Sub');
    expect(md).toContain('yarn test:coverage');

    const multi = renderInkToString(
      React.createElement(MultiSelect, {
        searchable: true,
        maxVisible: 1,
        options: [
          { label: 'Vitest', value: 'vitest', hint: 'Fast tests' },
          { label: 'Playwright', value: 'playwright', hint: 'E2E' },
        ],
        initialSelected: ['vitest'],
        onSubmit: () => undefined,
      }),
    );
    expect(multi).toContain('Vitest');

    const multiPlain = renderInkToString(
      React.createElement(MultiSelect, {
        searchable: false,
        options: [{ label: 'Jest', value: 'jest' }],
        onSubmit: () => undefined,
      }),
    );
    expect(multiPlain).toContain('Jest');
  });

  it('handles interactive MultiSelect keyboard navigation, search, toggle, Esc back, and Enter submit', async () => {
    const stdout = new PassThrough() as PassThrough & { columns?: number; rows?: number };
    stdout.columns = 100;
    stdout.rows = 40;
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

    const submitted: string[][] = [];
    let backCalls = 0;

    const instance = render(
      React.createElement(
        PlanetThemeProvider,
        null,
        React.createElement(MultiSelect, {
          searchable: true,
          minSelected: 1,
          options: [
            { label: 'Vitest', value: 'vitest' },
            { label: 'Playwright', value: 'playwright' },
          ],
          onBack: () => {
            backCalls += 1;
          },
          onSubmit: (sel) => {
            submitted.push(sel);
          },
        }),
      ),
      {
        stdout: stdout as unknown as NodeJS.WriteStream,
        stdin: stdin as unknown as NodeJS.ReadStream,
        patchConsole: false,
      },
    );

    const tick = () => new Promise((r) => setTimeout(r, 15));
    // Press Enter with 0 selected -> triggers minSelected warning
    stdin.write('\r');
    await tick();
    // Press Esc with no search query -> calls onBack()
    stdin.write('\u001b');
    await tick();
    // Press / to enter search, type 'vit', press Enter to exit search, then Esc to clear filter
    stdin.write('/');
    await tick();
    stdin.write('vit');
    await tick();
    stdin.write('\r');
    await tick();
    stdin.write('\u001b');
    await tick();
    // Press 'a' to select all, Space to toggle current, arrow down, Enter to submit
    stdin.write('a');
    await tick();
    stdin.write(' ');
    await tick();
    stdin.write('\u001b[B');
    await tick();
    stdin.write('\r');
    await tick();

    instance.unmount();

    expect(backCalls).toBe(1);
    expect(submitted).toEqual([['playwright']]);
  });
});
