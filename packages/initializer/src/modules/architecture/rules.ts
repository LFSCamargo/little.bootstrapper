import type {
  ArchitectureConfig,
  ArchitecturePattern,
  FileNamingConvention,
  FolderOrganization,
  Framework,
  Language,
  TestFileOrganization,
} from '../../types/index.js';

export interface ArchitectureOption {
  id: ArchitecturePattern;
  label: string;
  description: string;
  compatibleFolderOrgs: FolderOrganization[];
  supportedLanguages: Language[];
}

export const ARCHITECTURE_PATTERNS: ArchitectureOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Simple project structure with minimal abstraction',
    compatibleFolderOrgs: ['flat', 'layer-based', 'feature-based'],
    supportedLanguages: ['typescript', 'golang', 'rust', 'solidity'],
  },
  {
    id: 'layered',
    label: 'Layered',
    description: 'Organize code by responsibilities (controllers, services, repositories)',
    compatibleFolderOrgs: ['layer-based', 'feature-based'],
    supportedLanguages: ['typescript', 'golang', 'rust'],
  },
  {
    id: 'modular',
    label: 'Modular',
    description: 'Independent modules with explicit boundaries',
    compatibleFolderOrgs: ['module-based', 'feature-based'],
    supportedLanguages: ['typescript', 'golang', 'rust', 'solidity'],
  },
  {
    id: 'hexagonal',
    label: 'Ports & Adapters (Hexagonal)',
    description: 'Separate domain logic from external dependencies',
    compatibleFolderOrgs: ['layer-based', 'module-based'],
    supportedLanguages: ['typescript', 'golang', 'rust'],
  },
  {
    id: 'clean',
    label: 'Clean Architecture',
    description: 'Organize code around entities, use cases, interfaces, and infrastructure',
    compatibleFolderOrgs: ['layer-based', 'module-based'],
    supportedLanguages: ['typescript', 'golang', 'rust'],
  },
  {
    id: 'vertical-slice',
    label: 'Vertical Slice',
    description: 'Group code by individual features and use cases',
    compatibleFolderOrgs: ['feature-based', 'module-based'],
    supportedLanguages: ['typescript', 'golang', 'rust'],
  },
];

export const FOLDER_ORGANIZATIONS: {
  id: FolderOrganization;
  label: string;
  description: string;
}[] = [
  { id: 'flat', label: 'Flat', description: 'Minimal folder hierarchy' },
  {
    id: 'layer-based',
    label: 'Layer-based',
    description: 'Group files by technical responsibility',
  },
  { id: 'feature-based', label: 'Feature-based', description: 'Group files by feature' },
  {
    id: 'module-based',
    label: 'Module-based',
    description: 'Group files into independent modules',
  },
];

export const FILE_NAMING_CONVENTIONS: {
  id: FileNamingConvention;
  label: string;
  example: string;
}[] = [
  { id: 'kebab-case', label: 'Kebab-case (default)', example: 'planet-delivery.service.ts' },
  { id: 'camelCase', label: 'CamelCase', example: 'planetDelivery.service.ts' },
  { id: 'PascalCase', label: 'PascalCase', example: 'PlanetDelivery.service.ts' },
  { id: 'snake_case', label: 'Snake_case', example: 'planet_delivery.service.ts' },
];

export const TEST_FILE_ORGANIZATIONS: {
  id: TestFileOrganization;
  label: string;
  description: string;
}[] = [
  {
    id: 'colocated',
    label: 'Colocated',
    description: 'Tests alongside source files (user.service.test.ts)',
  },
  {
    id: 'dedicated-tests',
    label: 'Dedicated __tests__ folders',
    description: 'Tests inside feature/module __tests__/ directories',
  },
  {
    id: 'root-tests',
    label: 'Root tests/ directory',
    description: 'Centralized test structure mirroring the source tree',
  },
];

export function getCompatibleArchitecturePatterns(
  languages: Language[],
  frameworks: Framework[] = [],
): ArchitectureOption[] {
  // Smart-contract-only repos (Solidity / Rust smart contracts) are best suited to Standard or Modular
  const onlySmartContracts =
    languages.length > 0 &&
    languages.every((l) => l === 'solidity') &&
    frameworks.every((f) => f === 'foundry' || f === 'hardhat');

  if (onlySmartContracts) {
    return ARCHITECTURE_PATTERNS.filter((p) => p.id === 'standard' || p.id === 'modular');
  }

  return ARCHITECTURE_PATTERNS.filter((pattern) =>
    languages.some((lang) => pattern.supportedLanguages.includes(lang)),
  );
}

export function getCompatibleFolderOrganizations(
  pattern: ArchitecturePattern,
): FolderOrganization[] {
  const found = ARCHITECTURE_PATTERNS.find((p) => p.id === pattern);
  return found ? found.compatibleFolderOrgs : ['flat'];
}

export function formatFileName(words: string[], convention: FileNamingConvention): string {
  const clean = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  switch (convention) {
    case 'kebab-case':
      return clean.join('-');
    case 'snake_case':
      return clean.join('_');
    case 'camelCase':
      return clean.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
    case 'PascalCase':
      return clean.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }
}

export function getLanguageExtension(language: Language): string {
  switch (language) {
    case 'typescript':
      return 'ts';
    case 'golang':
      return 'go';
    case 'rust':
      return 'rs';
    case 'solidity':
      return 'sol';
  }
}

export function getTestFileName(baseName: string, language: Language): string {
  switch (language) {
    case 'typescript':
      return `${baseName}.test.ts`;
    case 'golang':
      return `${baseName}_test.go`;
    case 'rust':
      return `${baseName}_test.rs`;
    case 'solidity':
      return `${baseName}.t.sol`;
  }
}

export function generateFolderStructurePreview(
  config: ArchitectureConfig,
  primaryLanguage: Language = 'typescript',
  moduleName = 'planet-delivery',
): string[] {
  const words = moduleName.split(/[-_\s]+/);
  const ext = getLanguageExtension(primaryLanguage);
  const formatted = formatFileName(words, config.fileNaming);
  const testFile = getTestFileName(formatted, primaryLanguage);
  const barrel =
    primaryLanguage === 'typescript' ? 'index.ts' : primaryLanguage === 'rust' ? 'mod.rs' : null;

  const lines: string[] = ['src/'];

  const addTest = (prefix: string) => {
    if (config.testOrganization === 'colocated') {
      lines.push(`${prefix}${testFile}`);
    } else if (config.testOrganization === 'dedicated-tests') {
      lines.push(`${prefix}__tests__/`);
      lines.push(`${prefix}  ${testFile}`);
    }
  };

  if (config.pattern === 'standard') {
    lines.push(`  ${formatted}.${ext}`);
    addTest('  ');
  } else if (config.pattern === 'layered') {
    lines.push('  controllers/');
    lines.push(`    ${formatted}.controller.${ext}`);
    lines.push('  services/');
    lines.push(`    ${formatted}.service.${ext}`);
    addTest('    ');
    lines.push('  repositories/');
    lines.push(`    ${formatted}.repository.${ext}`);
  } else if (config.pattern === 'modular') {
    lines.push(`  modules/${formatted}/`);
    lines.push(`    ${formatted}.service.${ext}`);
    lines.push(`    ${formatted}.types.${ext}`);
    addTest('    ');
    if (config.barrelExports && barrel) {
      lines.push(`    ${barrel}`);
    }
  } else if (config.pattern === 'hexagonal') {
    lines.push('  domain/');
    lines.push(`    ${formatted}.entity.${ext}`);
    lines.push('  ports/');
    lines.push(`    ${formatted}.port.${ext}`);
    lines.push('  adapters/');
    lines.push(`    ${formatted}.adapter.${ext}`);
    addTest('    ');
  } else if (config.pattern === 'clean') {
    lines.push('  entities/');
    lines.push(`    ${formatted}.entity.${ext}`);
    lines.push('  use-cases/');
    lines.push(`    ${formatted}.usecase.${ext}`);
    addTest('    ');
    lines.push('  interfaces/');
    lines.push(`    ${formatted}.interface.${ext}`);
    lines.push('  infrastructure/');
    lines.push(`    ${formatted}.repo.${ext}`);
  } else if (config.pattern === 'vertical-slice') {
    lines.push(`  features/${formatted}/`);
    lines.push(`    ${formatted}.handler.${ext}`);
    lines.push(`    ${formatted}.schema.${ext}`);
    addTest('    ');
    if (config.barrelExports && barrel) {
      lines.push(`    ${barrel}`);
    }
  }

  if (config.barrelExports && barrel) {
    lines.push(`  ${barrel}`);
  }

  if (config.testOrganization === 'root-tests') {
    lines.push('tests/');
    lines.push(`  ${testFile}`);
  }

  return lines;
}
