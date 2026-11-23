import { describe, it, expect } from 'vitest';
import {
  getCompatibleArchitecturePatterns,
  getCompatibleFolderOrganizations,
  formatFileName,
  getLanguageExtension,
  getTestFileName,
  generateFolderStructurePreview,
} from '../index.js';

describe('modules/architecture (unit)', () => {
  it('filters architecture patterns and folder organizations by compatibility', () => {
    expect(getCompatibleArchitecturePatterns(['solidity'], ['foundry']).map((p) => p.id)).toEqual([
      'standard',
      'modular',
    ]);
    expect(getCompatibleArchitecturePatterns(['typescript'], ['nextjs']).length).toBe(6);
    expect(getCompatibleFolderOrganizations('hexagonal')).toEqual(['layer-based', 'module-based']);
    expect(getCompatibleFolderOrganizations('vertical-slice')).toEqual([
      'feature-based',
      'module-based',
    ]);
  });

  it('formats filenames, extensions, and test filenames across all languages', () => {
    expect(formatFileName(['planet', 'delivery'], 'kebab-case')).toBe('planet-delivery');
    expect(formatFileName(['planet', 'delivery'], 'camelCase')).toBe('planetDelivery');
    expect(formatFileName(['planet', 'delivery'], 'PascalCase')).toBe('PlanetDelivery');
    expect(formatFileName(['planet', 'delivery'], 'snake_case')).toBe('planet_delivery');

    expect(getLanguageExtension('typescript')).toBe('ts');
    expect(getLanguageExtension('golang')).toBe('go');
    expect(getLanguageExtension('rust')).toBe('rs');
    expect(getLanguageExtension('solidity')).toBe('sol');

    expect(getTestFileName('delivery', 'typescript')).toBe('delivery.test.ts');
    expect(getTestFileName('delivery', 'golang')).toBe('delivery_test.go');
    expect(getTestFileName('delivery', 'rust')).toBe('delivery_test.rs');
    expect(getTestFileName('delivery', 'solidity')).toBe('delivery.t.sol');
  });

  it('generates folder previews for colocated, dedicated __tests__, and root tests/', () => {
    const base = {
      pattern: 'modular' as const,
      folderOrganization: 'module-based' as const,
      fileNaming: 'kebab-case' as const,
      strictBoundaries: true,
      pathAliases: true,
      barrelExports: true,
      exampleModule: true,
    };
    expect(
      generateFolderStructurePreview({ ...base, testOrganization: 'colocated' }, 'typescript').join(
        '\n',
      ),
    ).toContain('planet-delivery.test.ts');
    expect(
      generateFolderStructurePreview(
        { ...base, testOrganization: 'dedicated-tests' },
        'typescript',
      ).join('\n'),
    ).toContain('__tests__/');
    expect(
      generateFolderStructurePreview(
        { ...base, testOrganization: 'root-tests' },
        'typescript',
      ).join('\n'),
    ).toContain('tests/');
  });
});
