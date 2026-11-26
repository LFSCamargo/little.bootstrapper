import { describe, it, expect } from 'vitest';
import { defaultWorkspaces, reconcileWorkspaces, getFrameworksForWorkspace } from '../index.js';
import { WorkspaceEntrySchema } from '../../validation/index.js';

describe('workspace selection consistency', () => {
  const entries = [
    { name: 'api', language: 'typescript', framework: 'hono', kind: 'backend' },
  ] as const;
  it.each(['chi', 'axum'] as const)(
    'replaces deselected Hono with the selected native backend %s',
    (framework) => {
      const language = framework === 'chi' ? 'golang' : 'rust';
      expect(
        reconcileWorkspaces([...entries], ['typescript', language], [framework, 'nextjs'], 'yarn'),
      ).toEqual([{ name: 'api', language, framework, kind: 'backend' }]);
    },
  );
  it('plans all selected backends and web frameworks with one contracts package per backend language', () => {
    const plan = defaultWorkspaces(
      ['typescript', 'golang', 'rust'],
      ['hono', 'express', 'chi', 'axum', 'nextjs', 'react-vite'],
      'npm',
    );
    expect(plan.apps.map((app) => app.name)).toEqual([
      'api',
      'api-express',
      'api-chi',
      'api-axum',
      'web',
      'web-react-vite',
    ]);
    expect(plan.packages.map((pkg) => pkg.language)).toEqual(['typescript', 'golang', 'rust']);
  });
  it('removes workspaces whose kind no longer has a selected framework', () => {
    expect(reconcileWorkspaces([...entries], ['typescript'], ['nextjs'], 'yarn')).toEqual([]);
    expect(getFrameworksForWorkspace('solidity', 'yarn', 'web')).toEqual([]);
  });
  it('preserves a custom name and a still-selected framework', () => {
    expect(
      reconcileWorkspaces(
        [{ name: 'billing', language: 'golang', framework: 'chi', kind: 'backend' }],
        ['golang'],
        ['chi', 'gin'],
        'yarn',
      )[0]?.name,
    ).toBe('billing');
  });
  it('derives headless defaults solely from the chosen stack', () => {
    expect(defaultWorkspaces(['golang'], ['chi'], 'yarn')).toEqual({
      apps: [{ name: 'api', language: 'golang', framework: 'chi', kind: 'backend' }],
      packages: [{ name: 'contracts', language: 'golang', framework: 'chi', kind: 'contracts' }],
    });
    expect(
      defaultWorkspaces(['rust', 'solidity'], ['axum', 'foundry'], 'yarn').packages[0]?.framework,
    ).toBe('foundry');
    expect(defaultWorkspaces(['typescript'], [], 'yarn')).toEqual({ apps: [], packages: [] });
  });
  it.each(['axum', 'hyper'] as const)(
    'creates and preserves shared Rust contracts for %s',
    (framework) => {
      const workspace = defaultWorkspaces(
        ['typescript', 'rust'],
        [framework, 'react-vite'],
        'yarn',
      );
      expect(workspace.packages).toEqual([
        { name: 'contracts', language: 'rust', framework, kind: 'contracts' },
      ]);
      expect(
        reconcileWorkspaces(
          workspace.packages,
          ['typescript', 'rust'],
          [framework, 'react-vite'],
          'yarn',
        ),
      ).toEqual(workspace.packages);
    },
  );
  it('rejects a language/framework mismatch at the boundary', () => {
    expect(
      WorkspaceEntrySchema.safeParse({ name: 'api', language: 'golang', framework: 'hono' })
        .success,
    ).toBe(false);
  });
});
