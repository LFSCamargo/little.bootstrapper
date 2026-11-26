import { UNSUPPORTED_TEMPLATES } from '../../modules/generators/initialization-safety.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import path from 'node:path';
import {
  Alert,
  BenderCard,
  ConfirmInput,
  DeliveryLoader,
  FolderPreview,
  MarkdownPanel,
  MultiSelect,
  Select,
  StatusFooter,
  StatusMessage,
  StepProgress,
  SummaryTable,
  type KeyHint,
} from '@little-bootstrapper/ui-cli';
import type {
  AIAgent,
  AdditionalTool,
  ArchitectureConfig,
  ArchitecturePattern,
  BootstrapConfig,
  FileNamingConvention,
  FolderOrganization,
  Framework,
  Language,
  McpServerId,
  PackageManager,
  ProjectDomain,
  RootLinter,
  TestFileOrganization,
  WorkspaceEntry,
  WorkspaceKind,
} from '../../types/index.js';
import {
  ADDITIONAL_TOOLS,
  AI_AGENTS,
  DEFAULT_VERIFIED_MCPS,
  LANGUAGES,
  PACKAGE_MANAGERS,
  PROJECT_DOMAINS,
  ROOT_LINTERS,
  VERIFIED_MCPS,
  WORKSPACE_KINDS,
  getCompatibleFrameworks,
  getFrameworksForWorkspace,
  recommendMcpsForProject,
  reconcileWorkspaces,
  defaultWorkspaces,
  recommendedFrameworks,
  resolveRulesForProject,
} from '../../modules/catalog/index.js';
import {
  FILE_NAMING_CONVENTIONS,
  TEST_FILE_ORGANIZATIONS,
  generateFolderStructurePreview,
  getCompatibleArchitecturePatterns,
  getCompatibleFolderOrganizations,
} from '../../modules/architecture/index.js';
import { generateProject, resolveRequiredUiPackages } from '../../modules/generators/index.js';
import {
  AuthorHandleSchema,
  CoverageThresholdSchema,
  DescriptionSchema,
  RepoNameSchema,
  WorkspaceNameSchema,
  formatZodError,
} from '../../modules/validation/index.js';

export interface InitWizardScreenProps {
  cwd: string;
  onBackToMenu: () => void;
  onCompleted: () => void;
}

type InitStep =
  | 'repo-name'
  | 'description'
  | 'author'
  | 'codeowners'
  | 'languages'
  | 'package-manager'
  | 'root-linter'
  | 'frameworks'
  | 'domains'
  | 'tools'
  | 'agents'
  | 'mcps'
  | 'apps-packages'
  | 'add-app-name'
  | 'add-app-kind'
  | 'add-app-lang'
  | 'add-app-fw'
  | 'add-pkg-name'
  | 'add-pkg-kind'
  | 'add-pkg-lang'
  | 'add-pkg-fw'
  | 'edit-ws-select'
  | 'edit-ws-lang'
  | 'edit-ws-fw'
  | 'remove-ws-select'
  | 'arch-pattern'
  | 'folder-org'
  | 'file-naming'
  | 'test-org'
  | 'coverage-enabled'
  | 'coverage-threshold'
  | 'arch-options'
  | 'preview'
  | 'generating'
  | 'done';

const TOTAL_STEPS = 21;

const STEP_INDEX: Record<InitStep, number> = {
  'repo-name': 1,
  description: 2,
  author: 3,
  codeowners: 4,
  languages: 5,
  'package-manager': 6,
  'root-linter': 7,
  frameworks: 8,
  domains: 9,
  tools: 10,
  agents: 11,
  mcps: 12,
  'apps-packages': 13,
  'add-app-name': 13,
  'add-app-kind': 13,
  'add-app-lang': 13,
  'add-app-fw': 13,
  'add-pkg-name': 13,
  'add-pkg-kind': 13,
  'add-pkg-lang': 13,
  'add-pkg-fw': 13,
  'edit-ws-select': 13,
  'edit-ws-lang': 13,
  'edit-ws-fw': 13,
  'remove-ws-select': 13,
  'arch-pattern': 14,
  'folder-org': 15,
  'file-naming': 16,
  'test-org': 17,
  'coverage-enabled': 18,
  'coverage-threshold': 19,
  'arch-options': 20,
  preview: 21,
  generating: 21,
  done: 21,
};

const MULTISELECT_STEPS = new Set<InitStep>([
  'languages',
  'frameworks',
  'domains',
  'tools',
  'agents',
  'mcps',
  'arch-options',
]);

const TEXT_STEPS = new Set<InitStep>([
  'repo-name',
  'description',
  'author',
  'add-app-name',
  'add-pkg-name',
  'coverage-threshold',
]);

export const InitWizardScreen: React.FC<InitWizardScreenProps> = ({
  cwd,
  onBackToMenu,
  onCompleted,
}) => {
  const { exit } = useApp();
  const [step, setStep] = useState<InitStep>('repo-name');
  const [history, setHistory] = useState<InitStep[]>([]);
  const [repoName, setRepoName] = useState('planet-express-app');
  const [description, setDescription] = useState('Universal AI-ready NX monorepo');
  const [author, setAuthor] = useState('fry');
  const [codeowners, setCodeowners] = useState(true);
  const [languages, setLanguages] = useState<Language[]>(['typescript']);
  const [packageManager, setPackageManager] = useState<PackageManager>('yarn');
  const [rootLinter, setRootLinter] = useState<RootLinter>('eslint');
  const monorepo = true;
  const useMakefiles = false;
  const [frameworks, setFrameworks] = useState<Framework[]>(recommendedFrameworks(['typescript']));
  const [tools, setTools] = useState<AdditionalTool[]>(
    ADDITIONAL_TOOLS.map((t) => t.id).filter((id) => id !== 'financial-audit'),
  );
  const [domains, setDomains] = useState<ProjectDomain[]>(['general']);
  const [agents, setAgents] = useState<AIAgent[]>(AI_AGENTS.map((a) => a.id));
  const [mcps, setMcps] = useState<McpServerId[]>(DEFAULT_VERIFIED_MCPS);
  const [apps, setApps] = useState<WorkspaceEntry[]>(
    () => defaultWorkspaces(languages, frameworks, packageManager).apps,
  );
  const [packages, setPackages] = useState<WorkspaceEntry[]>(
    () => defaultWorkspaces(languages, frameworks, packageManager).packages,
  );
  const [draftName, setDraftName] = useState('');
  const [draftKind, setDraftKind] = useState<WorkspaceKind>('backend');
  const [draftLang, setDraftLang] = useState<Language>('typescript');
  const [editingTarget, setEditingTarget] = useState<{
    bucket: 'app' | 'package';
    index: number;
  } | null>(null);
  const [arch, setArch] = useState<ArchitectureConfig>({
    pattern: 'modular',
    folderOrganization: 'module-based',
    fileNaming: 'kebab-case',
    testOrganization: 'dedicated-tests',
    strictBoundaries: true,
    pathAliases: true,
    barrelExports: true,
    exampleModule: true,
  });
  const [coverageEnabled, setCoverageEnabled] = useState(true);
  const [coverageThresholdInput, setCoverageThresholdInput] = useState('75');
  const [coverageThreshold, setCoverageThreshold] = useState(75);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [uiPkgs, setUiPkgs] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goTo = (next: InitStep) => {
    setHistory((prev) => [...prev, step]);
    setInputError(null);
    setStep(next);
  };

  const goBack = () => {
    setInputError(null);
    setError(null);
    if (history.length === 0) {
      onBackToMenu();
      return;
    }
    const previous = history[history.length - 1]!;
    setHistory((prev) => prev.slice(0, -1));
    setStep(previous);
  };

  // Global Esc back-navigation for non-MultiSelect steps (MultiSelect triggers onBack via its own Esc handler)
  useInput((_input, key) => {
    if (!key.escape) return;
    if (step === 'generating' || step === 'done') return;
    if (MULTISELECT_STEPS.has(step)) return;
    goBack();
  });

  // Auto-exit terminal cleanly once project generation finishes and full summary renders
  useEffect(() => {
    if (step !== 'done') return;
    onCompleted();
    const timer = setTimeout(() => exit(), 80);
    return () => clearTimeout(timer);
  }, [step, exit, onCompleted]);

  const configSnapshot = useMemo<BootstrapConfig>(
    () => ({
      version: '1.0.0',
      project: { name: repoName.replace(/\s+/g, '-'), description, author, codeowners },
      stack: {
        languages,
        packageManager,
        monorepo,
        useMakefiles,
        linter: rootLinter,
        prettier: true,
        frameworks,
        tools,
        agents,
        mcps,
        domains,
      },
      workspace: { apps, packages },
      architecture: arch,
      testing: {
        coverage: {
          enabled: coverageEnabled,
          threshold: coverageThreshold,
        },
      },
    }),
    [
      repoName,
      description,
      author,
      codeowners,
      languages,
      packageManager,
      rootLinter,
      monorepo,
      useMakefiles,
      frameworks,
      tools,
      agents,
      mcps,
      domains,
      apps,
      packages,
      arch,
      coverageEnabled,
      coverageThreshold,
    ],
  );

  const compatibleFrameworks = useMemo(
    () =>
      getCompatibleFrameworks(languages, packageManager).filter(
        (fw) =>
          fw.category !== 'Lint/Format' && fw.id !== 'jest' && !UNSUPPORTED_TEMPLATES.has(fw.id),
      ),
    [languages, packageManager],
  );
  const workspaceFrameworks = (language: Language, kind: WorkspaceKind) =>
    getFrameworksForWorkspace(language, packageManager, kind).filter((fw) =>
      compatibleFrameworks.some((candidate) => candidate.id === fw.id),
    );
  const availableKinds = WORKSPACE_KINDS.filter((kind) =>
    languages.some((language) => workspaceFrameworks(language, kind.id).length > 0),
  );
  const availableLanguages = LANGUAGES.filter(
    (language) =>
      languages.includes(language.id) && workspaceFrameworks(language.id, draftKind).length > 0,
  );
  const compatiblePatterns = useMemo(
    () => getCompatibleArchitecturePatterns(languages, frameworks),
    [languages, frameworks],
  );
  const requiredUi = useMemo(() => resolveRequiredUiPackages(configSnapshot), [configSnapshot]);
  const activeRules = useMemo(() => resolveRulesForProject(configSnapshot), [configSnapshot]);
  const previewLines = useMemo(
    () => [
      `${configSnapshot.project.name}/`,
      '  bootstrap.config.json',
      '  scripts/pipeline.sh (outside delivery pipeline)',
      '  docs/PIPELINE.md (pipeline & workspace docs)',
      `  root tooling: ${rootLinter} (root only) + .prettierrc (default)`,
      ...(mcps.length > 0 ? ['  mcp.json'] : []),
      '  .ai/rules/ (' + activeRules.length + ' context-selective rules)',
      '  .github/workflows/ (pr-validation.yml, release.yml)',
      ...requiredUi.map((u) => `  packages/${u}/`),
      ...apps.map((a) => `  apps/${a.name}/ (${a.language} / ${a.framework})`),
      ...packages.map((p) => `  packages/${p.name}/ (${p.language} / ${p.framework})`),
      ...generateFolderStructurePreview(arch, languages[0] ?? 'typescript').map((l) => `  ${l}`),
    ],
    [
      configSnapshot.project.name,
      rootLinter,
      mcps,
      activeRules.length,
      requiredUi,
      apps,
      packages,
      arch,
      languages,
    ],
  );

  const formSummaryRows = useMemo(
    () => [
      { field: 'Repository', value: `${configSnapshot.project.name} (@${author})` },
      { field: 'Description', value: description },
      {
        field: 'Stack',
        value: `${languages.join(', ')} • ${packageManager} • ${monorepo ? 'NX Monorepo' : 'Single Pkg'}`,
      },
      {
        field: 'Root Quality',
        value: `Linter: ${rootLinter} (root only) • Prettier: enabled (root default)`,
      },
      { field: 'Domains', value: domains.join(', ') },
      {
        field: 'Architecture',
        value: `${arch.pattern} / ${arch.folderOrganization} / ${arch.fileNaming}`,
      },
      {
        field: 'Tests & Options',
        value: `${arch.testOrganization} • aliases:${arch.pathAliases ? 'on' : 'off'} • barrels:${arch.barrelExports ? 'on' : 'off'}`,
      },
      {
        field: 'Coverage Gate',
        value: coverageEnabled
          ? `Enabled (${coverageThreshold}% lines/statements/functions/branches)`
          : 'Disabled',
      },
    ],
    [
      configSnapshot.project.name,
      author,
      description,
      languages,
      packageManager,
      rootLinter,
      monorepo,
      domains,
      arch,
      coverageEnabled,
      coverageThreshold,
    ],
  );

  const pluginsSummaryRows = useMemo(
    () => [
      { category: 'Frameworks', items: frameworks.join(', ') || 'none' },
      {
        category: 'Separated UI',
        items: requiredUi.map((u) => `packages/${u}`).join(', ') || 'none',
      },
      { category: 'AI Agents', items: agents.join(', ') },
      {
        category: 'Active Rules',
        items: `${activeRules.length} rules (${activeRules.slice(0, 4).join(', ')}…)`,
      },
      {
        category: 'Tools & Skills',
        items: `${tools.length} skills (${tools.slice(0, 3).join(', ')}…)`,
      },
      { category: 'Verified MCPs', items: mcps.join(', ') || 'none' },
    ],
    [frameworks, requiredUi, agents, activeRules, tools, mcps],
  );

  const footerHints = useMemo<KeyHint[]>(() => {
    if (step === 'done') {
      return [{ key: 'Exit', action: 'Delivery complete — returned to shell' }];
    }
    if (step === 'generating') {
      return [{ key: 'Wait', action: 'Scaffolding project files...' }];
    }
    if (TEXT_STEPS.has(step)) {
      return [
        { key: 'Type', action: 'Edit value' },
        { key: 'Enter', action: 'Next' },
        { key: 'Esc', action: history.length === 0 ? 'Back to menu' : 'Previous step' },
        { key: 'Ctrl+C', action: 'Quit' },
      ];
    }
    if (MULTISELECT_STEPS.has(step)) {
      return [
        { key: '↑/↓', action: 'Move' },
        { key: 'Space', action: 'Toggle' },
        { key: '/', action: 'Search' },
        { key: 'A', action: 'All' },
        { key: 'Enter', action: 'Next' },
        { key: 'Esc', action: 'Previous step' },
      ];
    }
    if (step === 'codeowners' || step === 'coverage-enabled') {
      return [
        { key: 'Y/N', action: 'Choose' },
        { key: 'Enter', action: 'Confirm' },
        { key: 'Esc', action: 'Previous step' },
      ];
    }
    if (step === 'preview') {
      return [
        { key: '↑/↓', action: 'Choose' },
        { key: 'Enter', action: 'Confirm & Generate' },
        { key: 'Esc', action: 'Edit previous step' },
      ];
    }
    return [
      { key: '↑/↓', action: 'Move' },
      { key: 'Enter', action: 'Next' },
      { key: 'Esc', action: 'Previous step' },
      { key: 'Ctrl+C', action: 'Quit' },
    ];
  }, [step, history.length]);

  const runGeneration = async () => {
    setStep('generating');
    try {
      const outDir = path.join(cwd, configSnapshot.project.name);
      const res = await generateProject(outDir, configSnapshot);
      setCreatedFiles(res.filesCreated);
      setUiPkgs(res.uiPackagesCreated);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Alert variant="error" title="Initialization Failed">
          {error}
        </Alert>
        <Select
          options={[{ label: '↩️  Back to Main Menu', value: 'back' }]}
          onChange={onBackToMenu}
        />
        <StatusFooter context="INIT ERROR" hints={[{ key: 'Esc/Enter', action: 'Back to menu' }]} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <StepProgress
        workflow="INIT"
        stepName={step}
        currentStep={STEP_INDEX[step]}
        totalSteps={TOTAL_STEPS}
      />

      {step === 'repo-name' && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text>Repo Name (no spaces): </Text>
            <TextInput
              value={repoName}
              onChange={(v) => {
                setRepoName(v);
                setInputError(null);
              }}
              onSubmit={() => {
                const res = RepoNameSchema.safeParse(repoName);
                if (!res.success) {
                  setInputError(formatZodError(res.error));
                  return;
                }
                setRepoName(res.data);
                goTo('description');
              }}
            />
          </Box>
          {inputError && <StatusMessage variant="error">{inputError}</StatusMessage>}
        </Box>
      )}

      {step === 'description' && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text>Description: </Text>
            <TextInput
              value={description}
              onChange={(v) => {
                setDescription(v);
                setInputError(null);
              }}
              onSubmit={() => {
                const res = DescriptionSchema.safeParse(description);
                if (!res.success) {
                  setInputError(formatZodError(res.error));
                  return;
                }
                setDescription(res.data);
                goTo('author');
              }}
            />
          </Box>
          {inputError && <StatusMessage variant="error">{inputError}</StatusMessage>}
        </Box>
      )}

      {step === 'author' && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text>GitHub Author Handle: @</Text>
            <TextInput
              value={author}
              onChange={(v) => {
                setAuthor(v);
                setInputError(null);
              }}
              onSubmit={() => {
                const res = AuthorHandleSchema.safeParse(author);
                if (!res.success) {
                  setInputError(formatZodError(res.error));
                  return;
                }
                setAuthor(res.data);
                goTo('codeowners');
              }}
            />
          </Box>
          {inputError && <StatusMessage variant="error">{inputError}</StatusMessage>}
        </Box>
      )}

      {step === 'codeowners' && (
        <Box gap={1}>
          <Text bold>Setup CODEOWNERS?</Text>
          <ConfirmInput
            defaultChoice={codeowners ? 'confirm' : 'cancel'}
            onConfirm={() => {
              setCodeowners(true);
              goTo('languages');
            }}
            onCancel={() => {
              setCodeowners(false);
              goTo('languages');
            }}
          />
        </Box>
      )}

      {step === 'languages' && (
        <Box flexDirection="column">
          <Text bold>Select Languages:</Text>
          <MultiSelect
            options={LANGUAGES.map((l) => ({ label: l.label, value: l.id, hint: l.description }))}
            initialSelected={languages}
            onBack={goBack}
            onSubmit={(selected) => {
              const compatible = getCompatibleFrameworks(selected, packageManager);
              setFrameworks((previous) => [
                ...new Set([
                  ...previous.filter((id) => compatible.some((fw) => fw.id === id)),
                  ...recommendedFrameworks(
                    selected.filter((language) => !languages.includes(language)),
                  ),
                ]),
              ]);
              setLanguages(selected);
              goTo(selected.includes('typescript') ? 'package-manager' : 'frameworks');
            }}
          />
        </Box>
      )}

      {step === 'package-manager' && (
        <Box flexDirection="column">
          <Text bold>JS/TS Package Manager:</Text>
          <Select
            defaultValue={packageManager}
            options={PACKAGE_MANAGERS.map((pm) => ({
              label: `${pm.label} — ${pm.description}`,
              value: pm.id,
            }))}
            onChange={(value) => {
              setPackageManager(value as PackageManager);
              goTo('root-linter');
            }}
          />
        </Box>
      )}

      {step === 'root-linter' && (
        <Box flexDirection="column">
          <Text bold>Root-Only Linter (Prettier is enabled at root by default):</Text>
          <Select
            defaultValue={rootLinter}
            options={ROOT_LINTERS.map((l) => ({
              label: `${l.label} — ${l.description}`,
              value: l.id,
            }))}
            onChange={(value) => {
              setRootLinter(value as RootLinter);
              goTo('frameworks');
            }}
          />
        </Box>
      )}

      {step === 'frameworks' && (
        <Box flexDirection="column">
          <Text bold>Select Frameworks, Design Systems, CSS, Testing &amp; ORMs:</Text>
          <MultiSelect
            searchable
            searchPlaceholder="Press / to search frameworks (nextjs, ink, shadcn, drizzle, axum)..."
            options={compatibleFrameworks.map((fw) => ({
              label: `[${fw.category}] ${fw.label}`,
              value: fw.id,
              category: fw.category,
              hint: fw.description,
            }))}
            initialSelected={frameworks.filter((f) =>
              compatibleFrameworks.some((cf) => cf.id === f),
            )}
            minSelected={0}
            onBack={goBack}
            onSubmit={(selected) => {
              setFrameworks(selected);
              const defaults = defaultWorkspaces(languages, selected, packageManager);
              const update = (previous: WorkspaceEntry[], suggested: WorkspaceEntry[]) => {
                const entries = reconcileWorkspaces(previous, languages, selected, packageManager);
                for (const entry of suggested) {
                  if (
                    !entries.some(
                      (existing) =>
                        existing.name === entry.name ||
                        (existing.kind === entry.kind &&
                          existing.language === entry.language &&
                          existing.framework === entry.framework),
                    )
                  )
                    entries.push(entry);
                }
                return entries;
              };
              setApps((prev) => update(prev, defaults.apps));
              setPackages((prev) => update(prev, defaults.packages));
              goTo('domains');
            }}
          />
        </Box>
      )}

      {step === 'domains' && (
        <Box flexDirection="column">
          <Text bold>Select Project Domains (loads tailored rules like financial-rules):</Text>
          <MultiSelect
            options={PROJECT_DOMAINS.map((d) => ({
              label: d.label,
              value: d.id,
              hint: d.description,
            }))}
            initialSelected={domains}
            minSelected={1}
            onBack={goBack}
            onSubmit={(selected) => {
              setDomains(selected);
              goTo('tools');
            }}
          />
        </Box>
      )}

      {step === 'tools' && (
        <Box flexDirection="column">
          <Text bold>Select Additional Tools &amp; Skills:</Text>
          <MultiSelect
            searchable
            options={ADDITIONAL_TOOLS.map((t) => ({
              label: t.label,
              value: t.id,
              hint: t.description,
            }))}
            initialSelected={tools}
            minSelected={0}
            onBack={goBack}
            onSubmit={(selected) => {
              setTools(selected);
              goTo('agents');
            }}
          />
        </Box>
      )}

      {step === 'agents' && (
        <Box flexDirection="column">
          <Text bold>Select Universal AI Agents:</Text>
          <MultiSelect
            options={AI_AGENTS.map((a) => ({ label: a.label, value: a.id, hint: a.description }))}
            initialSelected={agents}
            onBack={goBack}
            onSubmit={(selected) => {
              setAgents(selected);
              setMcps(recommendMcpsForProject(configSnapshot));
              goTo('mcps');
            }}
          />
        </Box>
      )}

      {step === 'mcps' && (
        <Box flexDirection="column">
          <Text bold>Select Verified Safe MCP Servers (stack-matched MCPs pre-selected):</Text>
          <MultiSelect
            searchable
            searchPlaceholder="Press / to search verified MCPs (nx, nextjs, postgres, stripe)..."
            options={VERIFIED_MCPS.map((m) => ({
              label: `[${m.category}] ${m.name} (${m.publisher})`,
              value: m.id,
              category: m.category,
              hint: m.description,
            }))}
            initialSelected={mcps}
            minSelected={0}
            onBack={goBack}
            onSubmit={(selected) => {
              setMcps(selected);
              goTo('apps-packages');
            }}
          />
        </Box>
      )}

      {step === 'apps-packages' && (
        <Box flexDirection="column" gap={1}>
          <SummaryTable
            title="Workspace Applications & Packages (Select Tech per Workspace)"
            columns={[
              { key: 'workspace', header: 'Workspace', color: 'cyan' },
              { key: 'role', header: 'Role', color: 'yellow' },
              { key: 'tech', header: 'Tech', color: 'green' },
            ]}
            rows={[
              ...apps.map((a) => ({
                workspace: `apps/${a.name}`,
                role: a.kind ?? 'app',
                tech: `${a.language} / ${a.framework}`,
              })),
              ...packages.map((p) => ({
                workspace: `packages/${p.name}`,
                role: p.kind ?? 'package',
                tech: `${p.language} / ${p.framework}`,
              })),
              ...requiredUi.map((u) => ({
                workspace: `packages/${u}`,
                role: 'ui-split',
                tech: 'typescript / shared-ui',
              })),
            ]}
          />
          <Select
            visibleOptionCount={6}
            options={[
              { label: '➡️  Continue to Architecture Selector', value: 'next' },
              ...(apps.length + packages.length > 0
                ? [{ label: '🛠️  Select Tech for an Existing App / Package', value: 'edit-ws' }]
                : []),
              ...(availableKinds.some((k) => ['backend', 'web', 'cli', 'mobile'].includes(k.id))
                ? [{ label: '➕ Add Application (apps/<name> + tech)', value: 'add-app' }]
                : []),
              { label: '📦 Add Package (packages/<name> + tech)', value: 'add-pkg' },
              ...(apps.length + packages.length > 0
                ? [{ label: '🗑️  Remove an App / Package', value: 'remove-ws' }]
                : []),
              { label: '⬅️  Back to Previous Step', value: 'back' },
            ]}
            onChange={(value) => {
              setDraftName('');
              if (value === 'add-app') {
                setDraftKind('backend');
                setDraftLang(languages[0] ?? 'typescript');
                goTo('add-app-name');
              } else if (value === 'add-pkg') {
                setDraftKind('library');
                setDraftLang(languages[0] ?? 'typescript');
                goTo('add-pkg-name');
              } else if (value === 'edit-ws') {
                goTo('edit-ws-select');
              } else if (value === 'remove-ws') {
                goTo('remove-ws-select');
              } else if (value === 'back') {
                goBack();
              } else {
                goTo('arch-pattern');
              }
            }}
          />
        </Box>
      )}

      {step === 'add-app-name' && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text>New App Name (apps/&lt;name&gt;, lowercase kebab-case): </Text>
            <TextInput
              value={draftName}
              onChange={(v) => {
                setDraftName(v);
                setInputError(null);
              }}
              onSubmit={() => {
                const res = WorkspaceNameSchema.safeParse(draftName);
                if (!res.success) {
                  setInputError(formatZodError(res.error));
                  return;
                }
                if (
                  [...apps, ...packages].some((entry) => entry.name === res.data) ||
                  ['ui-web', 'ui-mobile', 'ui-cli'].includes(res.data)
                ) {
                  setInputError('Choose a unique workspace name. UI package names are reserved.');
                  return;
                }
                setDraftName(res.data);
                goTo('add-app-kind');
              }}
            />
          </Box>
          {inputError && <StatusMessage variant="error">{inputError}</StatusMessage>}
        </Box>
      )}

      {step === 'add-app-kind' && (
        <Box flexDirection="column">
          <Text bold>Role / Skeleton for apps/{draftName}:</Text>
          <Select
            defaultValue={draftKind}
            options={availableKinds
              .filter((k) => ['backend', 'web', 'cli', 'mobile'].includes(k.id))
              .map((k) => ({ label: `${k.label} — ${k.description}`, value: k.id }))}
            onChange={(value) => {
              setDraftKind(value as WorkspaceKind);
              goTo('add-app-lang');
            }}
          />
        </Box>
      )}

      {step === 'add-app-lang' && (
        <Box flexDirection="column">
          <Text bold>Language for apps/{draftName}:</Text>
          <Select
            defaultValue={draftLang}
            options={availableLanguages.map((l) => ({
              label: `${l.label} — ${l.description}`,
              value: l.id,
            }))}
            onChange={(value) => {
              setDraftLang(value as Language);
              goTo('add-app-fw');
            }}
          />
        </Box>
      )}

      {step === 'add-app-fw' && (
        <Box flexDirection="column">
          <Text bold>
            Framework / Tech for apps/{draftName} ({draftLang}):
          </Text>
          <Select
            visibleOptionCount={6}
            options={workspaceFrameworks(draftLang, draftKind).map((fw) => ({
              label: `${fw.label} — ${fw.description}`,
              value: fw.id,
            }))}
            onChange={(value) => {
              setApps((prev) => [
                ...prev,
                {
                  name: draftName,
                  language: draftLang,
                  framework: value as Framework,
                  kind: draftKind,
                },
              ]);
              setStep('apps-packages');
            }}
          />
        </Box>
      )}

      {step === 'add-pkg-name' && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text>New Package Name (packages/&lt;name&gt;, lowercase kebab-case): </Text>
            <TextInput
              value={draftName}
              onChange={(v) => {
                setDraftName(v);
                setInputError(null);
              }}
              onSubmit={() => {
                const res = WorkspaceNameSchema.safeParse(draftName);
                if (!res.success) {
                  setInputError(formatZodError(res.error));
                  return;
                }
                if (
                  [...apps, ...packages].some((entry) => entry.name === res.data) ||
                  ['ui-web', 'ui-mobile', 'ui-cli'].includes(res.data)
                ) {
                  setInputError('Choose a unique workspace name. UI package names are reserved.');
                  return;
                }
                setDraftName(res.data);
                goTo('add-pkg-kind');
              }}
            />
          </Box>
          {inputError && <StatusMessage variant="error">{inputError}</StatusMessage>}
        </Box>
      )}

      {step === 'add-pkg-kind' && (
        <Box flexDirection="column">
          <Text bold>Role / Skeleton for packages/{draftName}:</Text>
          <Select
            defaultValue={draftKind}
            options={availableKinds
              .filter((k) => ['contracts', 'library', 'cli'].includes(k.id))
              .map((k) => ({ label: `${k.label} — ${k.description}`, value: k.id }))}
            onChange={(value) => {
              setDraftKind(value as WorkspaceKind);
              goTo('add-pkg-lang');
            }}
          />
        </Box>
      )}

      {step === 'add-pkg-lang' && (
        <Box flexDirection="column">
          <Text bold>Language for packages/{draftName}:</Text>
          <Select
            defaultValue={draftLang}
            options={availableLanguages.map((l) => ({
              label: `${l.label} — ${l.description}`,
              value: l.id,
            }))}
            onChange={(value) => {
              setDraftLang(value as Language);
              goTo('add-pkg-fw');
            }}
          />
        </Box>
      )}

      {step === 'add-pkg-fw' && (
        <Box flexDirection="column">
          <Text bold>
            Framework / Tech for packages/{draftName} ({draftLang}):
          </Text>
          <Select
            visibleOptionCount={6}
            options={workspaceFrameworks(draftLang, draftKind).map((fw) => ({
              label: `${fw.label} — ${fw.description}`,
              value: fw.id,
            }))}
            onChange={(value) => {
              setPackages((prev) => [
                ...prev,
                {
                  name: draftName,
                  language: draftLang,
                  framework: value as Framework,
                  kind: draftKind,
                },
              ]);
              setStep('apps-packages');
            }}
          />
        </Box>
      )}

      {step === 'edit-ws-select' && (
        <Box flexDirection="column">
          <Text bold>Choose App or Package to Configure Tech:</Text>
          <Select
            visibleOptionCount={6}
            options={[
              ...apps.map((a, idx) => ({
                label: `apps/${a.name} (${a.language} / ${a.framework})`,
                value: `app:${idx}`,
              })),
              ...packages.map((p, idx) => ({
                label: `packages/${p.name} (${p.language} / ${p.framework})`,
                value: `package:${idx}`,
              })),
              { label: '⬅️  Cancel', value: 'cancel' },
            ]}
            onChange={(value) => {
              if (value === 'cancel') {
                setStep('apps-packages');
                return;
              }
              const [bucket, idxStr] = value.split(':') as ['app' | 'package', string];
              const index = Number(idxStr);
              const target = bucket === 'app' ? apps[index] : packages[index];
              if (!target) {
                setStep('apps-packages');
                return;
              }
              setEditingTarget({ bucket, index });
              setDraftLang(target.language);
              setDraftKind(target.kind ?? (bucket === 'app' ? 'backend' : 'library'));
              goTo('edit-ws-lang');
            }}
          />
        </Box>
      )}

      {step === 'edit-ws-lang' && editingTarget && (
        <Box flexDirection="column">
          <Text bold>
            Select Language for{' '}
            {editingTarget.bucket === 'app'
              ? `apps/${apps[editingTarget.index]?.name ?? ''}`
              : `packages/${packages[editingTarget.index]?.name ?? ''}`}
            :
          </Text>
          <Select
            defaultValue={draftLang}
            options={availableLanguages.map((l) => ({
              label: `${l.label} — ${l.description}`,
              value: l.id,
            }))}
            onChange={(value) => {
              setDraftLang(value as Language);
              goTo('edit-ws-fw');
            }}
          />
        </Box>
      )}

      {step === 'edit-ws-fw' && editingTarget && (
        <Box flexDirection="column">
          <Text bold>
            Select Framework / Tech for{' '}
            {editingTarget.bucket === 'app'
              ? `apps/${apps[editingTarget.index]?.name ?? ''}`
              : `packages/${packages[editingTarget.index]?.name ?? ''}`}{' '}
            ({draftLang}):
          </Text>
          <Select
            visibleOptionCount={6}
            defaultValue={
              editingTarget.bucket === 'app'
                ? apps[editingTarget.index]?.framework
                : packages[editingTarget.index]?.framework
            }
            options={workspaceFrameworks(draftLang, draftKind).map((fw) => ({
              label: `${fw.label} — ${fw.description}`,
              value: fw.id,
            }))}
            onChange={(value) => {
              const fw = value as Framework;
              if (editingTarget.bucket === 'app') {
                setApps((prev) =>
                  prev.map((item, i) =>
                    i === editingTarget.index
                      ? { ...item, language: draftLang, framework: fw }
                      : item,
                  ),
                );
              } else {
                setPackages((prev) =>
                  prev.map((item, i) =>
                    i === editingTarget.index
                      ? { ...item, language: draftLang, framework: fw }
                      : item,
                  ),
                );
              }
              setEditingTarget(null);
              setStep('apps-packages');
            }}
          />
        </Box>
      )}

      {step === 'remove-ws-select' && (
        <Box flexDirection="column">
          <Text bold>Remove an App or Package:</Text>
          <Select
            visibleOptionCount={6}
            options={[
              ...apps.map((a, idx) => ({
                label: `Remove apps/${a.name} (${a.language} / ${a.framework})`,
                value: `app:${idx}`,
              })),
              ...packages.map((p, idx) => ({
                label: `Remove packages/${p.name} (${p.language} / ${p.framework})`,
                value: `package:${idx}`,
              })),
              { label: '⬅️  Cancel', value: 'cancel' },
            ]}
            onChange={(value) => {
              if (value !== 'cancel') {
                const [bucket, idxStr] = value.split(':') as ['app' | 'package', string];
                const index = Number(idxStr);
                if (bucket === 'app') {
                  setApps((prev) => prev.filter((_, i) => i !== index));
                } else {
                  setPackages((prev) => prev.filter((_, i) => i !== index));
                }
              }
              setStep('apps-packages');
            }}
          />
        </Box>
      )}

      {step === 'arch-pattern' && (
        <Box flexDirection="column">
          <Text bold>Architecture Pattern:</Text>
          <Select
            defaultValue={arch.pattern}
            visibleOptionCount={6}
            options={compatiblePatterns.map((p) => ({
              label: `${p.label} — ${p.description}`,
              value: p.id,
            }))}
            onChange={(value) => {
              const pattern = value as ArchitecturePattern;
              const compatOrgs = getCompatibleFolderOrganizations(pattern);
              setArch((prev) => ({
                ...prev,
                pattern,
                folderOrganization: compatOrgs.includes(prev.folderOrganization)
                  ? prev.folderOrganization
                  : (compatOrgs[0] ?? 'flat'),
              }));
              goTo('folder-org');
            }}
          />
        </Box>
      )}

      {step === 'folder-org' && (
        <Box flexDirection="column">
          <Text bold>Folder Organization (compatible with {arch.pattern}):</Text>
          <Select
            defaultValue={arch.folderOrganization}
            options={getCompatibleFolderOrganizations(arch.pattern).map((org) => ({
              label: org,
              value: org,
            }))}
            onChange={(value) => {
              setArch((prev) => ({ ...prev, folderOrganization: value as FolderOrganization }));
              goTo('file-naming');
            }}
          />
        </Box>
      )}

      {step === 'file-naming' && (
        <Box flexDirection="column">
          <Text bold>File Naming Convention:</Text>
          <Select
            defaultValue={arch.fileNaming}
            options={FILE_NAMING_CONVENTIONS.map((f) => ({
              label: `${f.label} (${f.example})`,
              value: f.id,
            }))}
            onChange={(value) => {
              setArch((prev) => ({ ...prev, fileNaming: value as FileNamingConvention }));
              goTo('test-org');
            }}
          />
        </Box>
      )}

      {step === 'test-org' && (
        <Box flexDirection="column">
          <Text bold>Test File Organization:</Text>
          <Select
            defaultValue={arch.testOrganization}
            options={TEST_FILE_ORGANIZATIONS.map((t) => ({
              label: `${t.label} — ${t.description}`,
              value: t.id,
            }))}
            onChange={(value) => {
              setArch((prev) => ({ ...prev, testOrganization: value as TestFileOrganization }));
              goTo('coverage-enabled');
            }}
          />
        </Box>
      )}

      {step === 'coverage-enabled' && (
        <Box gap={1}>
          <Text bold>Enable test coverage threshold enforcement (CLI &amp; Web)?</Text>
          <ConfirmInput
            defaultChoice={coverageEnabled ? 'confirm' : 'cancel'}
            onConfirm={() => {
              setCoverageEnabled(true);
              goTo('coverage-threshold');
            }}
            onCancel={() => {
              setCoverageEnabled(false);
              goTo('arch-options');
            }}
          />
        </Box>
      )}

      {step === 'coverage-threshold' && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text>Minimum Coverage Threshold % (0–100, default 75): </Text>
            <TextInput
              value={coverageThresholdInput}
              onChange={(v) => {
                setCoverageThresholdInput(v);
                setInputError(null);
              }}
              onSubmit={() => {
                const res = CoverageThresholdSchema.safeParse(coverageThresholdInput);
                if (!res.success) {
                  setInputError(formatZodError(res.error));
                  return;
                }
                setCoverageThreshold(res.data);
                setCoverageThresholdInput(String(res.data));
                goTo('arch-options');
              }}
            />
          </Box>
          {inputError && <StatusMessage variant="error">{inputError}</StatusMessage>}
        </Box>
      )}

      {step === 'arch-options' && (
        <Box flexDirection="column">
          <Text bold>Architecture Additional Options:</Text>
          <MultiSelect
            options={[
              {
                label: 'Strict Architecture Boundaries',
                value: 'strictBoundaries',
                hint: 'Enforce module dependency rules',
              },
              {
                label: 'Path Aliases',
                value: 'pathAliases',
                hint: 'Generate @/* internal import aliases',
              },
              {
                label: 'Barrel Exports',
                value: 'barrelExports',
                hint: 'Generate index.ts entry points',
              },
              {
                label: 'Example Module',
                value: 'exampleModule',
                hint: 'Scaffold sample module following architecture',
              },
            ]}
            initialSelected={[
              ...(arch.strictBoundaries ? ['strictBoundaries'] : []),
              ...(arch.pathAliases ? ['pathAliases'] : []),
              ...(arch.barrelExports ? ['barrelExports'] : []),
              ...(arch.exampleModule ? ['exampleModule'] : []),
            ]}
            minSelected={0}
            onBack={goBack}
            onSubmit={(selected) => {
              const s = new Set(selected);
              setArch((prev) => ({
                ...prev,
                strictBoundaries: s.has('strictBoundaries'),
                pathAliases: s.has('pathAliases'),
                barrelExports: s.has('barrelExports'),
                exampleModule: s.has('exampleModule'),
              }));
              goTo('preview');
            }}
          />
        </Box>
      )}

      {step === 'preview' && (
        <Box flexDirection="column" gap={1}>
          <SummaryTable
            title="Form Responses & Project Setup"
            columns={[
              { key: 'field', header: 'Setting', color: 'cyan' },
              { key: 'value', header: 'Selection', color: 'white' },
            ]}
            rows={formSummaryRows}
          />
          <SummaryTable
            title="Plugins, Rules & Verified MCPs"
            columns={[
              { key: 'category', header: 'Category', color: 'magenta' },
              { key: 'items', header: 'Selected', color: 'green' },
            ]}
            rows={pluginsSummaryRows}
          />
          <FolderPreview
            title={`Folder Structure Preview (${arch.pattern} / ${arch.folderOrganization})`}
            lines={previewLines}
          />
          <Select
            options={[
              { label: '✅ Confirm & Launch little.bootstrapper Delivery!', value: 'confirm' },
              { label: '⬅️  Go Back & Adjust Options', value: 'back' },
              { label: '↩️  Cancel & Return to Main Menu', value: 'cancel' },
            ]}
            onChange={(value) => {
              if (value === 'confirm') void runGeneration();
              else if (value === 'back') goBack();
              else onBackToMenu();
            }}
          />
        </Box>
      )}

      {step === 'generating' && <DeliveryLoader />}

      {step === 'done' && (
        <Box flexDirection="column" gap={1}>
          <BenderCard
            message={`Created ${createdFiles.length} files in ./${configSnapshot.project.name}`}
          />
          <SummaryTable
            title="Delivered Project Configuration"
            columns={[
              { key: 'field', header: 'Setting', color: 'cyan' },
              { key: 'value', header: 'Selection', color: 'white' },
            ]}
            rows={formSummaryRows}
          />
          <SummaryTable
            title="Installed Plugins, UI Packages, Rules & MCPs"
            columns={[
              { key: 'category', header: 'Category', color: 'magenta' },
              { key: 'items', header: 'Installed', color: 'green' },
            ]}
            rows={[
              ...pluginsSummaryRows.filter((r) => r.category !== 'Separated UI'),
              {
                category: 'Separated UI',
                items: uiPkgs.map((u) => `packages/${u}`).join(', ') || 'none',
              },
            ]}
          />
          <FolderPreview title="Generated Structure" lines={previewLines} />
          <MarkdownPanel
            title="Next Steps"
            markdown={[
              `# Ready to Launch: ${configSnapshot.project.name}`,
              `- \`cd ${configSnapshot.project.name}\``,
              `- Run \`./scripts/pipeline.sh --all\` to install, format-check, lint (root ${rootLinter}), build, test & validate`,
              `- Inspect \`docs/PIPELINE.md\` for workspace topology (Backend \`GET /health\`, \`packages/contracts\`, and Web Sample App)`,
              '- Open in Open Code, Antigravity, Claude, Codex, or Cursor — all rules & `mcp.json` are active!',
            ].join('\n')}
          />
        </Box>
      )}

      <StatusFooter
        context={step === 'done' ? 'DONE' : `INIT ${STEP_INDEX[step]}/${TOTAL_STEPS}`}
        hints={footerHints}
      />
    </Box>
  );
};
