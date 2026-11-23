import type {
  AIAgent,
  AdditionalTool,
  Framework,
  Language,
  MarketplaceRuleId,
  PackageManager,
  ProjectDomain,
  ProjectInfo,
  UiPackageKind,
  WorkspaceEntry,
} from './stack.types.js';
import type { ArchitectureConfig, TestingConfig } from './architecture.types.js';
import type { McpServerId } from './mcp.types.js';

export interface StackConfig {
  languages: Language[];
  packageManager: PackageManager;
  monorepo: boolean;
  useMakefiles: boolean;
  frameworks: Framework[];
  tools: AdditionalTool[];
  agents: AIAgent[];
  mcps?: McpServerId[];
  domains?: ProjectDomain[];
  rules?: MarketplaceRuleId[];
}

export interface BootstrapConfig {
  version: string;
  project: ProjectInfo;
  stack: StackConfig;
  workspace: {
    apps: WorkspaceEntry[];
    packages: WorkspaceEntry[];
  };
  architecture: ArchitectureConfig;
  testing?: TestingConfig;
}

export interface AuditedPackageVersion {
  name: string;
  version: string;
  auditedAt: string;
  status: 'audited';
  cveCount: 0;
}

export interface DetectedSetup {
  hasBootstrapConfig: boolean;
  packageManager: PackageManager | null;
  languages: Language[];
  agents: AIAgent[];
  tools: AdditionalTool[];
  missingTools: AdditionalTool[];
  missingAgents: AIAgent[];
  rulesPresent: string[];
  rulesMissing: string[];
  uiPackagesPresent: UiPackageKind[];
  hasSecurityConfigs: boolean;
  hasCommitHooks: boolean;
  hasMcpConfig: boolean;
  mcpsConfigured: string[];
}

export interface VersionAuditItem {
  file: string;
  packageName: string;
  currentVersion: string;
  recommendedVersion: string;
  isPinned: boolean;
  needsUpdate: boolean;
  status: 'ok' | 'unpinned' | 'outdated' | 'vulnerable' | 'unknown';
  advisory?: string;
}
