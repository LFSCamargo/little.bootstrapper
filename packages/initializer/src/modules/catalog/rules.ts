import type {
  BootstrapConfig,
  Framework,
  MarketplaceRule,
  MarketplaceRuleId,
  RuleCategory,
} from '../../types/index.js';

export const MARKETPLACE_RULES: MarketplaceRule[] = [
  {
    id: 'quality-gating',
    name: 'Quality Gating',
    category: 'Core',
    description: 'Mandatory typecheck, lint, unit/integration/E2E tests & exact pinned versions',
    templatePath: 'templates/rules/core/quality-gating.md',
    tags: ['core', 'ci', 'pinned', 'quality'],
    body: `- Every change MUST pass typecheck, lint, unit tests, integration tests, E2E tests, and build before completion.
- All dependencies MUST use exact pinned, audited versions (no \`^\` or \`~\`).
- Never suppress compiler or linter errors without a documented justification.`,
  },
  {
    id: 'security',
    name: 'Security & Secrets',
    category: 'Core',
    description: 'OpenGrep, GitLeaks, zero hardcoded secrets, Zod boundary validation',
    templatePath: 'templates/rules/core/security.md',
    tags: ['core', 'security', 'opengrep', 'gitleaks'],
    body: `- Never commit secrets, API keys, or credentials. Use \`.env\` and \`.env.example\`.
- Run OpenGrep (\`.opengrep.yml\`) and GitLeaks (\`.gitleaks.toml\`) checks before merging.
- Validate and sanitize all external inputs at system boundaries (e.g. Zod schemas).`,
  },
  {
    id: 'test-driven',
    name: 'Test Driven Development',
    category: 'Core',
    description: 'Unit & integration tests close to implementation in __tests__/',
    templatePath: 'templates/rules/core/test-driven.md',
    tags: ['core', 'testing', 'tdd'],
    body: `- Write unit and integration tests alongside implementation inside \`__tests__/\` folders.
- Reserve root \`tests/e2e/\` exclusively for end-to-end tests.
- Cover happy paths, edge cases, and failure modes.`,
  },
  {
    id: 'regression-testing',
    name: 'Regression Testing',
    category: 'Core',
    description: 'Every bug fix must include a regression test',
    templatePath: 'templates/rules/core/regression-testing.md',
    tags: ['core', 'testing', 'regression'],
    body: `- Every bug fix MUST include a regression test that fails before the fix and passes after.
- Never delete or weaken existing tests to make a build pass.`,
  },
  {
    id: 'e2e-testing',
    name: 'E2E Testing',
    category: 'Core',
    description: 'Playwright web E2E and spawned CLI binary E2E tests in tests/e2e/',
    templatePath: 'templates/rules/core/e2e-testing.md',
    tags: ['core', 'testing', 'e2e', 'playwright'],
    body: `- Critical user flows MUST have end-to-end tests in root \`tests/e2e/\` (Playwright for web, spawned binary for CLI).
- Keep E2E tests deterministic and assert zero uncaught page/runtime errors.`,
  },
  {
    id: 'project-architecture',
    name: 'Project Architecture & Atomic Unit Isolation',
    category: 'Core',
    description: 'Atomic commands/, modules/, types/, assets/ isolation with barrel boundaries',
    templatePath: 'templates/rules/core/project-architecture.md',
    tags: ['core', 'architecture', 'modular'],
    body: `- Keep domain units independently swappable under \`src/commands/\`, \`src/modules/\`, \`src/types/\`, and \`src/assets/\`.
- Cross-module imports MUST go through barrel \`index.ts\` entry points so changing one unit never breaks siblings.`,
  },
  {
    id: 'project-overview',
    name: 'Project Overview',
    category: 'Core',
    description: 'Canonical project metadata, stack, and package manager summary',
    templatePath: 'templates/rules/core/project-overview.md',
    tags: ['core', 'overview'],
    body: `- Always consult \`bootstrap.config.json\` for the project's canonical stack, package manager, and conventions.`,
  },
  {
    id: 'docs-sync',
    name: 'Docs Sync',
    category: 'Core',
    description: 'Keep README, CONTRIBUTING, rules, and docs site in sync on behavior changes',
    templatePath: 'templates/rules/core/docs-sync.md',
    tags: ['core', 'docs'],
    body: `- Whenever CLI commands, architecture, or public contracts change, update \`README.md\`, \`CONTRIBUTING.md\`, \`.ai/rules/\`, and web docs in place.`,
  },
  {
    id: 'ai-docs-discipline',
    name: 'AI Docs Discipline (Anti-Doc-Sprawl)',
    category: 'Core',
    description: 'Prevent doc bloat, duplicate markdown files, and LLM context dilution',
    templatePath: 'templates/rules/core/ai-docs-discipline.md',
    tags: ['core', 'docs', 'ai', 'hygiene'],
    body: `- **One truth per concern**: Update canonical docs in place; NEVER spawn throwaway \`NOTES.md\`, \`SUMMARY.md\`, or duplicate design dumps.
- **Keep rules concise (<60 lines)**: Imperative DO/DON'T bullets only.
- **Context-selective rules**: Keep only active-stack rules in \`.ai/rules/\`; store reusable templates in \`templates/rules/\`.`,
  },
  {
    id: 'web-ui-components',
    name: 'Web UI Components Separation',
    category: 'Framework',
    description: 'Keep all shared ShadCN & Aceternity UI primitives inside packages/ui-web',
    templatePath: 'templates/rules/core/web-ui-components.md',
    tags: ['web', 'ui', 'shadcn', 'aceternity'],
    body: `- All reusable Web UI components (ShadCN, Aceternity UI, shared primitives) MUST live inside \`packages/ui-web\`.
- Web apps in \`apps/*\` import from \`packages/ui-web\` and never duplicate shared primitives locally.`,
  },
  {
    id: 'mobile-ui-components',
    name: 'Mobile UI Components Separation',
    category: 'Framework',
    description: 'Keep all shared React Native / Lynx primitives inside packages/ui-mobile',
    templatePath: 'templates/rules/core/mobile-ui-components.md',
    tags: ['mobile', 'ui', 'react-native', 'lynx'],
    body: `- All reusable Mobile UI components and design tokens MUST live inside \`packages/ui-mobile\`.
- Mobile apps consume shared components from \`packages/ui-mobile\`.`,
  },
  {
    id: 'cli-ui-components',
    name: 'CLI UI Components Separation',
    category: 'Framework',
    description: 'Keep all shared React Ink terminal components inside packages/ui-cli',
    templatePath: 'templates/rules/core/cli-ui-components.md',
    tags: ['cli', 'ui', 'ink'],
    body: `- All reusable CLI UI components (React Ink banners, MultiSelects, FolderPreview, ASCII frames) MUST live inside \`packages/ui-cli\`.`,
  },
  {
    id: 'typescript-rules',
    name: 'TypeScript Strict Rules',
    category: 'Language',
    description: 'Zero any, Zod boundary validation, discriminated unions, no floating promises',
    templatePath: 'templates/rules/languages/typescript-rules.md',
    tags: ['typescript', 'language', 'zod'],
    body: `- Zero \`any\` or unchecked casts; validate all external inputs with Zod \`.safeParse()\`.
- Model states with discriminated unions and never leave floating unhandled promises.
- Communicate across modules strictly via barrel \`index.ts\` exports.`,
  },
  {
    id: 'go-anti-patterns',
    name: 'Go Anti-Patterns',
    category: 'Language',
    description: 'Explicit error wrapping, context-first, bounded goroutines, consumer interfaces',
    templatePath: 'templates/rules/languages/go-anti-patterns.md',
    tags: ['golang', 'go', 'language'],
    body: `- Handle every returned \`error\` explicitly (\`fmt.Errorf("...: %w", err)\`); never ignore with \`_\`.
- Pass \`context.Context\` first on all I/O and bound goroutine lifetimes cleanly.
- Define small interfaces at the consumer and avoid \`init()\` magic or global mutable state.`,
  },
  {
    id: 'rust-anti-patterns',
    name: 'Rust Anti-Patterns',
    category: 'Language',
    description: 'No unwrap/expect in prod, borrow over clone, non-blocking async, SAFETY docs',
    templatePath: 'templates/rules/languages/rust-anti-patterns.md',
    tags: ['rust', 'language'],
    body: `- Avoid \`.unwrap()\` and \`.expect()\` in production paths; propagate typed \`Result\` (\`thiserror\`/\`anyhow\`).
- Prefer borrowing over \`.clone()\` in hot paths and never block async Tokio worker threads.
- Keep \`unsafe\` minimal and documented with \`// SAFETY:\` invariants.`,
  },
  {
    id: 'solidity-anti-patterns',
    name: 'Solidity Anti-Patterns',
    category: 'Language',
    description: 'Pinned pragma, custom errors, CEI, SafeERC20, Foundry fuzzing',
    templatePath: 'templates/rules/languages/solidity-anti-patterns.md',
    tags: ['solidity', 'evm', 'language'],
    body: `- Pin exact Solidity pragma (never floating \`^\`) and prefer custom errors over revert strings.
- Follow Checks-Effects-Interactions, use \`SafeERC20\`, and gate PRs with Foundry fuzz & invariant tests.`,
  },
  {
    id: 'ink-anti-patterns',
    name: 'React Ink CLI Anti-Patterns',
    category: 'Framework',
    description:
      'Use @inkjs/ui in packages/ui-cli, unmount-safe async/timers, TTY checks, no console.log in TUI, memoized lists, Zod inline validation',
    templatePath: 'templates/rules/frameworks/ink-anti-patterns.md',
    tags: ['ink', 'ink-ui', 'cli', 'react', 'framework'],
    body: `- Use \`@inkjs/ui\` (\`Select\`, \`Spinner\`, \`ProgressBar\`, \`Alert\`, \`Badge\`, \`StatusMessage\`, \`ConfirmInput\`, \`ThemeProvider\`, \`extendTheme\`) inside \`packages/ui-cli\` instead of legacy Ink prompt wrappers.
- Guard async \`useEffect\` calls with a \`cancelled\` cleanup flag, \`clearInterval()\` on animations, and \`.catch()\` error handling.
- Check \`process.stdin.isTTY\` before \`render(<App />)\` so non-TTY pipes exit cleanly with helpful flags.
- Never mix raw \`console.log\` inside active Ink components; memoize filtered/computed lists with \`useMemo\`.
- Validate interactive text inputs inline with Zod and keep CLI commands headless-testable in \`src/commands/\`.`,
  },
  {
    id: 'nextjs-anti-patterns',
    name: 'Next.js App Router Anti-Patterns',
    category: 'Framework',
    description:
      'Server Components default, MotionValue over mousemove useState, hydration safety, metadataBase, not-found.tsx',
    templatePath: 'templates/rules/frameworks/nextjs-anti-patterns.md',
    tags: ['nextjs', 'react', 'web', 'framework'],
    body: `- Keep pages and layouts as Server Components by default; push \`'use client'\` strictly to interactive leaf components.
- Never drive 60fps pointer/scroll animations with React \`useState\`; use Framer Motion \`useMotionValue\` + \`useMotionTemplate\`.
- Add \`suppressHydrationWarning\` on \`<html>\` when toggling dark/light classes; configure \`metadataBase\` and \`not-found.tsx\`.
- Never use \`useEffect\` for data fetching or derived state, and never leak private keys via \`NEXT_PUBLIC_\`.`,
  },
  {
    id: 'mobile-anti-patterns',
    name: 'Mobile (React Native / Lynx) Anti-Patterns',
    category: 'Framework',
    description:
      'Virtualized lists, free UI thread, hoisted styles, safe areas, subscription cleanup',
    templatePath: 'templates/rules/frameworks/mobile-anti-patterns.md',
    tags: ['mobile', 'react-native', 'lynx', 'framework'],
    body: `- Never render long lists with \`.map()\` inside \`ScrollView\`; use virtualized lists with memoized \`renderItem\`.
- Keep the JS/UI thread free, hoist styles/tokens into \`packages/ui-mobile\`, and respect safe areas & keyboard insets.
- Unsubscribe from native event emitters on unmount and use cached image loaders.`,
  },
  {
    id: 'rest-api-anti-patterns',
    name: 'REST API Anti-Patterns',
    category: 'Framework',
    description:
      'Boundary validation, bounded pagination, N+1 prevention, timeouts, structured errors',
    templatePath: 'templates/rules/frameworks/rest-api-anti-patterns.md',
    tags: [
      'api',
      'backend',
      'express',
      'fastify',
      'hono',
      'elysia',
      'fiber',
      'gin',
      'axum',
      'framework',
    ],
    body: `- Validate params, queries, headers, and bodies at every route boundary with schemas.
- Enforce pagination caps, eliminate N+1 SQL queries, configure timeouts + graceful shutdown, and never leak raw stack traces.`,
  },
  {
    id: 'smart-contracts-anti-patterns',
    name: 'Smart Contracts Anti-Patterns',
    category: 'Framework',
    description:
      'CEI reentrancy defense, signer checks, safe rounding, bounded loops, oracle hardening',
    templatePath: 'templates/rules/frameworks/smart-contracts-anti-patterns.md',
    tags: ['web3', 'smart-contracts', 'foundry', 'hardhat', 'anchor', 'soroban', 'framework'],
    body: `- Enforce Checks-Effects-Interactions (CEI) and reentrancy guards on all value-moving functions.
- Verify caller/signer/PDA authority, prevent precision loss (multiply before divide), avoid unbounded storage loops, and harden oracle inputs with TWAP/staleness checks.`,
  },
  {
    id: 'nx-monorepo-rules',
    name: 'NX Monorepo Rules',
    category: 'Framework',
    description:
      'Workspace boundaries, project.json targets, workspace:* links, no relative cross-package imports',
    templatePath: 'templates/rules/frameworks/nx-monorepo-rules.md',
    tags: ['nx', 'monorepo', 'workspaces', 'framework'],
    body: `- Never use cross-package relative imports (\`../../packages/...\`); import by scoped package name.
- Declare \`project.json\` targets (\`build\`, \`test\`, \`typecheck\`) and keep UI packages separated by platform.
- Use \`workspace:*\` for internal links and exact pinned versions for external deps.`,
  },
  {
    id: 'shadcn-aceternity-rules',
    name: 'ShadCN + Aceternity UI + Tailwind Rules',
    category: 'Framework',
    description:
      'Centralize primitives in packages/ui-web, CVA + cn(), server-only Pro keys, MotionValue perf',
    templatePath: 'templates/rules/frameworks/shadcn-aceternity-rules.md',
    tags: ['shadcn', 'aceternity', 'tailwind', 'ui', 'web', 'framework'],
    body: `- Centralize ShadCN Radix primitives and Aceternity effects in \`packages/ui-web\` with CVA + \`cn()\`.
- Keep \`ACETERNITY_PRO_API_KEY\` server-only in \`.env.local\` and drive pointer animations via \`useMotionValue\`.`,
  },
  {
    id: 'playwright-testing-rules',
    name: 'Playwright E2E Testing Rules',
    category: 'Framework',
    description:
      'Root tests/e2e/, accessible getByRole locators, zero waitForTimeout, zero pageerror assertions',
    templatePath: 'templates/rules/frameworks/playwright-testing-rules.md',
    tags: ['playwright', 'e2e', 'testing', 'browser', 'framework'],
    body: `- Place E2E tests exclusively in root \`tests/e2e/\` and prefer \`getByRole\`/\`getByTestId\` over CSS selectors.
- Never use \`waitForTimeout()\`; capture \`page.on('pageerror')\` and assert zero uncaught errors.`,
  },
  {
    id: 'orm-database-rules',
    name: 'ORM & Database Safety Rules',
    category: 'Framework',
    description:
      'Parameterized queries, zero N+1, explicit projections, indexes & atomic transactions (Kysely/Drizzle/TypeORM/Mongoose)',
    templatePath: 'templates/rules/frameworks/orm-database-rules.md',
    tags: ['drizzle', 'kysely', 'typeorm', 'mongoose', 'sql', 'database', 'orm', 'framework'],
    body: `- Use parameterized queries only; zero N+1 loops, explicit column projections, indexed foreign/filter keys, and ACID transactions for multi-write mutations.`,
  },
  {
    id: 'nuxt-vue-anti-patterns',
    name: 'Nuxt.js & Vue 3 Anti-Patterns',
    category: 'Framework',
    description:
      'SSR-safe useFetch/useAsyncData, immutable props, ClientOnly guards, XSS-safe templates',
    templatePath: 'templates/rules/frameworks/nuxt-vue-anti-patterns.md',
    tags: ['nuxtjs', 'vue', 'inspira-ui', 'framework'],
    body: `- Use \`useFetch\`/\`useAsyncData\` for SSR data, never mutate props, guard browser globals inside \`onMounted\`/\`<ClientOnly>\`, and avoid unsanitized \`v-html\`.`,
  },
  {
    id: 'tauri-desktop-rules',
    name: 'Tauri v2 Desktop Security Rules',
    category: 'Framework',
    description:
      'Least-privilege ACL capabilities, Rust-side IPC validation, non-blocking async commands',
    templatePath: 'templates/rules/frameworks/tauri-desktop-rules.md',
    tags: ['tauri', 'desktop', 'rust', 'framework'],
    body: `- Enforce least-privilege Tauri v2 capability ACLs, validate all \`#[tauri::command]\` inputs in Rust, offload heavy work to async tasks, and return typed \`Result\`.`,
  },
  {
    id: 'financial-rules',
    name: 'Financial / FinTech / Ledger Rules',
    category: 'Domain',
    description:
      'Zero float money, double-entry immutable ledger, idempotency keys, ACID locking, PCI/PII redaction',
    templatePath: 'templates/rules/domains/financial-rules.md',
    tags: ['financial', 'fintech', 'payments', 'ledger', 'banking', 'trading', 'domain'],
    body: `- **NEVER use IEEE-754 floats for money**: Use integer minor units (\`bigint\`/\`int64\` cents + ISO-4217 currency) or fixed-point decimals (\`rust_decimal\`, \`shopspring/decimal\`, \`Decimal.js\`).
- **Double-entry immutable ledger**: Never \`UPDATE\`/\`DELETE\` historical ledger rows; record reversals as offsetting entries (\`SUM(debits) == SUM(credits)\`).
- **Mandatory idempotency keys**: Persist unique \`Idempotency-Key\` constraints on every payment/transfer/balance mutation.
- **Atomic concurrency**: Wrap balance checks + ledger writes in ACID transactions (\`FOR UPDATE\` / \`SERIALIZABLE\` / optimistic locking).
- **Explicit rounding, audit trails & PCI redaction**: Declare rounding rules explicitly, log immutable audit metadata, and redact PAN/CVV/PII before logging.`,
  },
];

const CORE_RULES: MarketplaceRuleId[] = [
  'quality-gating',
  'security',
  'test-driven',
  'regression-testing',
  'e2e-testing',
  'project-architecture',
  'project-overview',
  'docs-sync',
  'ai-docs-discipline',
];

const WEB_FWS: Framework[] = ['nextjs', 'react-vite', 'nuxtjs', 'tauri', 'shadcn', 'aceternity-ui'];
const MOBILE_FWS: Framework[] = [
  'react-native',
  'lynx',
  'nativewind',
  'uniwind',
  'unistyles',
  'tamagui',
];
const API_FWS: Framework[] = [
  'elysia',
  'express',
  'koa',
  'fastify',
  'hono',
  'fiber',
  'gin',
  'chi',
  'echo',
  'axum',
  'hyper',
];
const CONTRACT_FWS: Framework[] = [
  'foundry',
  'hardhat',
  'anchor',
  'soroban-sdk',
  'near-sdk',
  'stylus-sdk',
];
const ORM_FWS: Framework[] = ['kysely', 'drizzle', 'typeorm', 'mongoose'];

export function getMarketplaceRuleById(id: string): MarketplaceRule | undefined {
  return MARKETPLACE_RULES.find((r) => r.id === id);
}

export function searchMarketplaceRules(query: string, category?: RuleCategory): MarketplaceRule[] {
  const normalized = query.trim().toLowerCase();
  return MARKETPLACE_RULES.filter((rule) => {
    if (category && rule.category !== category) return false;
    if (!normalized) return true;
    const haystack = [rule.id, rule.name, rule.category, rule.description, ...rule.tags]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

/**
 * Context-selective rule resolver:
 * Selects ONLY the rules matching the project's actual languages, frameworks, and domains
 * so .ai/rules/ stays high-signal and free of irrelevant bloat.
 */
export function resolveRulesForProject(config: BootstrapConfig): MarketplaceRuleId[] {
  const rules = new Set<MarketplaceRuleId>(CORE_RULES);
  const langs = new Set(config.stack.languages);
  const fws = new Set<Framework>([
    ...config.stack.frameworks,
    ...config.workspace.apps.map((a) => a.framework),
    ...config.workspace.packages.map((p) => p.framework),
  ]);
  const domains = new Set(config.stack.domains ?? []);

  // Language-specific rules
  if (langs.has('typescript')) rules.add('typescript-rules');
  if (langs.has('golang')) rules.add('go-anti-patterns');
  if (langs.has('rust')) rules.add('rust-anti-patterns');
  if (langs.has('solidity')) rules.add('solidity-anti-patterns');

  // Framework-specific & UI separation rules
  if (config.stack.monorepo) {
    rules.add('nx-monorepo-rules');
  }
  if (fws.has('ink')) {
    rules.add('ink-anti-patterns');
    rules.add('cli-ui-components');
  }
  if (fws.has('nextjs')) {
    rules.add('nextjs-anti-patterns');
  }
  if (fws.has('nuxtjs')) {
    rules.add('nuxt-vue-anti-patterns');
  }
  if (fws.has('tauri')) {
    rules.add('tauri-desktop-rules');
  }
  if (fws.has('shadcn') || fws.has('aceternity-ui')) {
    rules.add('shadcn-aceternity-rules');
  }
  if (fws.has('playwright')) {
    rules.add('playwright-testing-rules');
  }
  if (ORM_FWS.some((f) => fws.has(f))) {
    rules.add('orm-database-rules');
  }
  if (WEB_FWS.some((f) => fws.has(f))) {
    rules.add('web-ui-components');
  }
  if (MOBILE_FWS.some((f) => fws.has(f))) {
    rules.add('mobile-anti-patterns');
    rules.add('mobile-ui-components');
  }
  if (API_FWS.some((f) => fws.has(f))) {
    rules.add('rest-api-anti-patterns');
  }
  if (CONTRACT_FWS.some((f) => fws.has(f)) || domains.has('web3')) {
    rules.add('smart-contracts-anti-patterns');
  }

  // Domain-specific rules
  if (domains.has('financial')) {
    rules.add('financial-rules');
  }

  // Any explicitly requested extra marketplace rules
  for (const extra of config.stack.rules ?? []) {
    rules.add(extra);
  }

  return Array.from(rules);
}
