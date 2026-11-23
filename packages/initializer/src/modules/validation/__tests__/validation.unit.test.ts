import { describe, it, expect } from 'vitest';
import {
  RepoNameSchema,
  DescriptionSchema,
  AuthorHandleSchema,
  WorkspaceNameSchema,
  ModuleNameSchema,
  CoverageThresholdSchema,
  CoverageConfigSchema,
  InitCommandArgsSchema,
  McpsInstallArgsSchema,
  NormalizeCommandArgsSchema,
  GenerateCommandArgsSchema,
  BootstrapConfigSchema,
  formatZodError,
} from '../index.js';

describe('modules/validation (unit)', () => {
  it('validates repository names (rejects spaces and invalid characters)', () => {
    expect(RepoNameSchema.safeParse('planet-express.app').success).toBe(true);
    const badSpaces = RepoNameSchema.safeParse('planet express');
    expect(badSpaces.success).toBe(false);
    if (!badSpaces.success) {
      expect(formatZodError(badSpaces.error)).toContain('must not contain spaces');
    }
    expect(RepoNameSchema.safeParse('').success).toBe(false);
    expect(RepoNameSchema.safeParse('-leading-dash').success).toBe(false);
  });

  it('validates descriptions, GitHub author handles, workspace names, and module names', () => {
    expect(DescriptionSchema.safeParse('Good news, everyone!').success).toBe(true);
    expect(DescriptionSchema.safeParse('   ').success).toBe(false);

    const parsedAuthor = AuthorHandleSchema.safeParse('@lfscamargo');
    expect(parsedAuthor.success).toBe(true);
    if (parsedAuthor.success) expect(parsedAuthor.data).toBe('lfscamargo');
    expect(AuthorHandleSchema.safeParse('-bad-handle').success).toBe(false);

    expect(WorkspaceNameSchema.safeParse('ui-web').success).toBe(true);
    expect(WorkspaceNameSchema.safeParse('Bad_Upper').success).toBe(false);

    expect(ModuleNameSchema.safeParse('warp-drive').success).toBe(true);
    expect(ModuleNameSchema.safeParse('bad module').success).toBe(false);
  });

  it('enforces Elysia + Bun cross-field rule in InitCommandArgsSchema', () => {
    const invalid = InitCommandArgsSchema.safeParse({
      name: 'ship-api',
      description: 'REST API',
      author: 'fry',
      codeowners: true,
      monorepo: true,
      languages: ['typescript'],
      packageManager: 'yarn',
      frameworks: ['elysia'],
      mcps: ['context7'],
      outDir: '/tmp/ship-api',
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(formatZodError(invalid.error)).toContain('elysia');
    }

    const valid = InitCommandArgsSchema.safeParse({
      name: 'ship-api',
      description: 'REST API',
      author: 'fry',
      codeowners: true,
      monorepo: true,
      languages: ['typescript'],
      packageManager: 'bun',
      frameworks: ['elysia'],
      mcps: ['context7'],
      outDir: '/tmp/ship-api',
    });
    expect(valid.success).toBe(true);
  });

  it('validates mcps, normalize, generate args and bootstrap.config.json schemas', () => {
    expect(McpsInstallArgsSchema.safeParse({ ids: ['context7', 'github'] }).success).toBe(true);
    expect(McpsInstallArgsSchema.safeParse({ ids: ['malicious-mcp'] }).success).toBe(false);

    expect(NormalizeCommandArgsSchema.safeParse({ agent: 'claude' }).success).toBe(true);
    expect(NormalizeCommandArgsSchema.safeParse({ agent: 'unknown-agent' }).success).toBe(false);

    expect(GenerateCommandArgsSchema.safeParse({ moduleName: 'dark-matter' }).success).toBe(true);
    expect(GenerateCommandArgsSchema.safeParse({ moduleName: '' }).success).toBe(false);

    expect(
      BootstrapConfigSchema.safeParse({
        version: '1.0.0',
        project: { name: 'invalid name', description: 'x', author: 'fry', codeowners: true },
        stack: {
          languages: [],
          packageManager: 'yarn',
          monorepo: true,
          useMakefiles: false,
          frameworks: [],
          tools: [],
          agents: [],
        },
        workspace: { apps: [], packages: [] },
        architecture: {
          pattern: 'modular',
          folderOrganization: 'module-based',
          fileNaming: 'kebab-case',
          testOrganization: 'dedicated-tests',
          strictBoundaries: true,
          pathAliases: true,
          barrelExports: true,
          exampleModule: true,
        },
      }).success,
    ).toBe(false);
  });

  it('validates coverage enable toggle and threshold range (0–100 integer, default 75)', () => {
    expect(CoverageThresholdSchema.parse('75')).toBe(75);
    expect(CoverageThresholdSchema.parse(0)).toBe(0);
    expect(CoverageThresholdSchema.parse(100)).toBe(100);
    expect(CoverageThresholdSchema.safeParse(-1).success).toBe(false);
    expect(CoverageThresholdSchema.safeParse(101).success).toBe(false);
    expect(CoverageThresholdSchema.safeParse(75.5).success).toBe(false);
    expect(CoverageThresholdSchema.safeParse('not-a-number').success).toBe(false);

    expect(CoverageConfigSchema.parse({ enabled: true, threshold: 80 })).toEqual({
      enabled: true,
      threshold: 80,
    });

    const parsedDefaults = InitCommandArgsSchema.parse({
      name: 'planet-cov',
      description: 'Coverage defaults check',
      author: 'fry',
      codeowners: true,
      monorepo: true,
      languages: ['typescript'],
      packageManager: 'yarn',
      frameworks: ['vitest'],
      mcps: ['context7'],
      outDir: '/tmp/planet-cov',
    });
    expect(parsedDefaults.coverageEnabled).toBe(true);
    expect(parsedDefaults.coverageThreshold).toBe(75);
  });
});
