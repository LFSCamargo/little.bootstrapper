import { z } from 'zod';
import {
  ADDITIONAL_TOOLS,
  AI_AGENTS,
  FRAMEWORKS,
  LANGUAGES,
  MARKETPLACE_RULES,
  PACKAGE_MANAGERS,
  PROJECT_DOMAINS,
  ROOT_LINTERS,
  VERIFIED_MCPS,
  WORKSPACE_KINDS,
} from '../catalog/index.js';
import type {
  AIAgent,
  AdditionalTool,
  ArchitecturePattern,
  FileNamingConvention,
  FolderOrganization,
  Framework,
  Language,
  MarketplaceRuleId,
  McpServerId,
  PackageManager,
  ProjectDomain,
  RootLinter,
  TestFileOrganization,
  WorkspaceKind,
} from '../../types/index.js';

function enumFromList<T extends string>(items: readonly T[]) {
  return z.enum(items as [T, ...T[]]);
}

export const PackageManagerSchema = enumFromList<PackageManager>(PACKAGE_MANAGERS.map((p) => p.id));

export const RootLinterSchema = enumFromList<RootLinter>(ROOT_LINTERS.map((l) => l.id));

export const WorkspaceKindSchema = enumFromList<WorkspaceKind>(WORKSPACE_KINDS.map((k) => k.id));

export const LanguageSchema = enumFromList<Language>(LANGUAGES.map((l) => l.id));

export const AIAgentSchema = enumFromList<AIAgent>(AI_AGENTS.map((a) => a.id));

export const FrameworkSchema = enumFromList<Framework>(FRAMEWORKS.map((f) => f.id));

export const AdditionalToolSchema = enumFromList<AdditionalTool>(ADDITIONAL_TOOLS.map((t) => t.id));

export const McpServerIdSchema = enumFromList<McpServerId>(VERIFIED_MCPS.map((m) => m.id));

export const ProjectDomainSchema = enumFromList<ProjectDomain>(PROJECT_DOMAINS.map((d) => d.id));

export const MarketplaceRuleIdSchema = enumFromList<MarketplaceRuleId>(
  MARKETPLACE_RULES.map((r) => r.id),
);

export const ArchitecturePatternSchema = z.enum([
  'standard',
  'layered',
  'modular',
  'hexagonal',
  'clean',
  'vertical-slice',
] satisfies ArchitecturePattern[]);

export const FolderOrganizationSchema = z.enum([
  'flat',
  'layer-based',
  'feature-based',
  'module-based',
] satisfies FolderOrganization[]);

export const FileNamingSchema = z.enum([
  'kebab-case',
  'camelCase',
  'PascalCase',
  'snake_case',
] satisfies FileNamingConvention[]);

export const TestOrganizationSchema = z.enum([
  'colocated',
  'dedicated-tests',
  'root-tests',
] satisfies TestFileOrganization[]);

export const RepoNameSchema = z
  .string()
  .trim()
  .min(1, 'Repository name is required')
  .max(100, 'Repository name must be at most 100 characters')
  .refine((val) => !/\s/.test(val), 'Repository name must not contain spaces')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    'Repository name must start with a letter or number and only contain letters, numbers, dots, underscores, or hyphens',
  );

export const DescriptionSchema = z
  .string()
  .trim()
  .min(1, 'Description is required')
  .max(280, 'Description must be at most 280 characters');

export const AuthorHandleSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, ''))
  .pipe(
    z
      .string()
      .min(1, 'GitHub author handle is required')
      .max(39, 'GitHub handle must be at most 39 characters')
      .regex(
        /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
        'Invalid GitHub handle (alphanumeric and single hyphens, no leading/trailing hyphen)',
      ),
  );

export const WorkspaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Workspace name is required')
  .max(64, 'Workspace name must be at most 64 characters')
  .regex(
    /^[a-z0-9][a-z0-9-]*$/,
    'Workspace name must be lowercase kebab-case (letters, numbers, hyphens)',
  );

export const ModuleNameSchema = z
  .string()
  .trim()
  .min(1, 'Module name is required')
  .max(64, 'Module name must be at most 64 characters')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    'Module name must start with alphanumeric and contain no spaces',
  );

export const WorkspaceEntrySchema = z.object({
  name: WorkspaceNameSchema,
  language: LanguageSchema,
  framework: FrameworkSchema,
  kind: WorkspaceKindSchema.optional(),
});

export const ArchitectureConfigSchema = z.object({
  pattern: ArchitecturePatternSchema,
  folderOrganization: FolderOrganizationSchema,
  fileNaming: FileNamingSchema,
  testOrganization: TestOrganizationSchema,
  strictBoundaries: z.boolean(),
  pathAliases: z.boolean(),
  barrelExports: z.boolean(),
  exampleModule: z.boolean(),
});

export const CoverageThresholdSchema = z.coerce
  .number()
  .int('Coverage threshold must be a whole integer between 0 and 100')
  .min(0, 'Coverage threshold must be at least 0%')
  .max(100, 'Coverage threshold cannot exceed 100%');

export const CoverageConfigSchema = z.object({
  enabled: z.boolean(),
  threshold: CoverageThresholdSchema,
});

export const TestingConfigSchema = z.object({
  coverage: CoverageConfigSchema,
});

export const BootstrapConfigSchema = z.object({
  version: z.string().min(1),
  project: z.object({
    name: RepoNameSchema,
    description: DescriptionSchema,
    author: AuthorHandleSchema,
    codeowners: z.boolean(),
  }),
  stack: z.object({
    languages: z.array(LanguageSchema).min(1, 'Select at least one language'),
    packageManager: PackageManagerSchema,
    monorepo: z.boolean(),
    useMakefiles: z.boolean(),
    linter: RootLinterSchema.optional(),
    prettier: z.boolean().optional(),
    frameworks: z.array(FrameworkSchema),
    tools: z.array(AdditionalToolSchema),
    agents: z.array(AIAgentSchema).min(1, 'Select at least one AI agent'),
    mcps: z.array(McpServerIdSchema).optional(),
    domains: z.array(ProjectDomainSchema).optional(),
    rules: z.array(MarketplaceRuleIdSchema).optional(),
  }),
  workspace: z.object({
    apps: z.array(WorkspaceEntrySchema),
    packages: z.array(WorkspaceEntrySchema),
  }),
  architecture: ArchitectureConfigSchema,
  testing: TestingConfigSchema.optional(),
});

export const InitCommandArgsSchema = z
  .object({
    name: RepoNameSchema,
    description: DescriptionSchema,
    author: AuthorHandleSchema,
    codeowners: z.boolean(),
    monorepo: z.boolean(),
    languages: z.array(LanguageSchema).min(1, 'At least one language is required'),
    packageManager: PackageManagerSchema,
    linter: RootLinterSchema.optional(),
    prettier: z.boolean().optional(),
    frameworks: z.array(FrameworkSchema),
    mcps: z.array(McpServerIdSchema),
    domains: z.array(ProjectDomainSchema).optional(),
    rules: z.array(MarketplaceRuleIdSchema).optional(),
    coverageEnabled: z.boolean().default(true),
    coverageThreshold: CoverageThresholdSchema.default(75),
    outDir: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.frameworks.includes('elysia') && data.packageManager !== 'bun') {
      ctx.addIssue({
        code: 'custom',
        path: ['frameworks'],
        message: 'Framework "elysia" is only compatible when packageManager is "bun"',
      });
    }
  });

export const McpsInstallArgsSchema = z.object({
  ids: z.array(McpServerIdSchema).min(1, 'Provide at least one verified MCP server ID to install'),
});

export const RulesInstallArgsSchema = z.object({
  ids: z
    .array(MarketplaceRuleIdSchema)
    .min(1, 'Provide at least one marketplace rule ID to install'),
});

export const NormalizeCommandArgsSchema = z.object({
  agent: AIAgentSchema,
  mcps: z.array(McpServerIdSchema).optional(),
});

export const GenerateCommandArgsSchema = z.object({
  moduleName: ModuleNameSchema,
});

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const pathStr = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `✖ ${pathStr}${issue.message}`;
    })
    .join('\n');
}
