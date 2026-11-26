import type { Framework, Language, PackageManager, WorkspaceEntry } from '../../types/index.js';
import { FRAMEWORKS, getFrameworksForWorkspace } from './catalog.js';

export function recommendedFrameworks(languages: readonly Language[]): Framework[] {
  const defaults: Record<Language, Framework[]> = {
    typescript: ['hono', 'ink', 'nextjs', 'vitest', 'playwright', 'shadcn', 'aceternity-ui'],
    golang: ['chi'],
    rust: ['axum'],
    solidity: ['foundry'],
  };
  return languages.flatMap((language) => defaults[language]);
}

/** Keep workspace choices consistent when languages or selected frameworks change. */
export function reconcileWorkspaces(
  entries: WorkspaceEntry[],
  languages: Language[],
  frameworks: Framework[],
  packageManager: PackageManager,
): WorkspaceEntry[] {
  const defaults = defaultWorkspaces(languages, frameworks, packageManager);
  return entries.flatMap((entry) => {
    if (entry.kind === 'contracts' && entry.name === 'contracts' && defaults.packages[0])
      return [{ ...entry, ...defaults.packages[0] }];
    const candidates = languages.flatMap((language) =>
      getFrameworksForWorkspace(language, packageManager, entry.kind)
        .filter((fw) => frameworks.includes(fw.id))
        .map((fw) => ({ language, framework: fw.id })),
    );
    const choice =
      candidates.find((c) => c.language === entry.language && c.framework === entry.framework) ??
      candidates.find((c) => c.language === entry.language) ??
      candidates[0];
    return choice ? [{ ...entry, ...choice }] : [];
  });
}

export function defaultWorkspaces(
  languages: Language[],
  frameworks: Framework[],
  pm: PackageManager,
) {
  const unsupported = frameworks.find((fw) =>
    ['anchor', 'soroban-sdk', 'near-sdk', 'stylus-sdk'].includes(fw),
  );
  if (unsupported)
    throw new Error(`Rust smart-contract template ${unsupported} is not implemented.`);
  const apps: WorkspaceEntry[] = [];
  const packages: WorkspaceEntry[] = [];
  const selected = [...new Set(frameworks)].map((id) => FRAMEWORKS.find((fw) => fw.id === id));
  for (const kind of ['backend', 'web', 'cli', 'contracts'] as const) {
    const bucket = kind === 'contracts' ? packages : apps;
    const base = kind === 'backend' ? 'api' : kind;
    for (const fw of selected) {
      if (!fw?.language || !languages.includes(fw.language)) continue;
      if (kind === 'contracts' && fw.language !== 'solidity') continue;
      if (
        !getFrameworksForWorkspace(fw.language, pm, kind).some(
          (candidate) => candidate.id === fw.id,
        )
      )
        continue;
      const name = bucket.some((entry) => entry.name === base) ? `${base}-${fw.id}` : base;
      bucket.push({ name, language: fw.language, framework: fw.id, kind });
    }
  }
  for (const app of apps.filter((app) => app.kind === 'backend')) {
    if (packages.some((pkg) => pkg.language === app.language)) continue;
    const name = packages.length ? `contracts-${app.language}` : 'contracts';
    packages.push({
      name,
      language: app.language,
      framework: app.language === 'typescript' ? 'vitest' : app.framework,
      kind: 'contracts',
    });
  }
  return { apps, packages };
}
