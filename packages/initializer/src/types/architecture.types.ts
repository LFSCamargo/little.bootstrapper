export type ArchitecturePattern =
  | 'standard'
  | 'layered'
  | 'modular'
  | 'hexagonal'
  | 'clean'
  | 'vertical-slice';

export type FolderOrganization = 'flat' | 'layer-based' | 'feature-based' | 'module-based';

export type FileNamingConvention = 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';

export type TestFileOrganization = 'colocated' | 'dedicated-tests' | 'root-tests';

export interface CoverageConfig {
  enabled: boolean;
  threshold: number;
}

export interface TestingConfig {
  coverage: CoverageConfig;
}

export interface ArchitectureConfig {
  pattern: ArchitecturePattern;
  folderOrganization: FolderOrganization;
  fileNaming: FileNamingConvention;
  testOrganization: TestFileOrganization;
  strictBoundaries: boolean;
  pathAliases: boolean;
  barrelExports: boolean;
  exampleModule: boolean;
}
