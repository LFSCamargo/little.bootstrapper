import { DocsNavigation } from '@/components/docs-navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardSpotlight,
  GlowingEffect,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SpotlightNew,
  StarsBackground,
  getAceternityProStatus,
} from '@little-bootstrapper/ui-web';
import { Terminal, Shield, Layers, Cpu, Package, Workflow } from 'lucide-react';

export default function DocsPage() {
  const proStatus = getAceternityProStatus();

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-6 pb-20 pt-32 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <DocsNavigation />
      <div data-testid="docs-content" className="min-w-0 space-y-8 [overflow-wrap:anywhere]">
        <div
          id="overview"
          className="relative isolate overflow-hidden rounded-3xl border border-zinc-200/90 bg-zinc-50/85 p-8 backdrop-blur-xl sm:p-10 dark:border-zinc-800/90 dark:bg-zinc-900/65"
        >
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <SpotlightNew
              gradientFirst="radial-gradient(65% 65% at 50% 25%, hsla(172, 72%, 55%, .08) 0, hsla(172, 72%, 45%, .02) 50%, transparent 80%)"
              translateY={-300}
            />
            <div className="hidden dark:block">
              <StarsBackground starDensity={0.00025} />
            </div>
          </div>
          <div className="space-y-4">
            <Badge>little.bootstrapper documentation</Badge>
            <h1 className="text-4xl font-medium tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Documentation
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Complete reference for <code>little.bootstrapper</code> — CLI workflows, per-workspace
              tech selection, root-only linting with Prettier default, outside delivery pipeline,
              starter product skeleton, and universal AI agent setup.
            </p>
          </div>
        </div>

        <div data-testid="docs-grid" className="grid items-start gap-6 xl:grid-cols-2">
          <CardSpotlight id="cli-commands">
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-bold text-teal-600 dark:text-teal-400">
                  <Terminal className="h-5 w-5" />
                  CLI Commands
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Interactive React Ink TUI + CI-ready flags
                </p>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <p>
                  <code>little-bootstrapper init [--linter eslint|biome|oxlint|none]</code> — CORE
                  Initialize Setup wizard with per-app/package tech selection, root-only linter +
                  Prettier default, and initialized starter product.
                </p>
                <p>
                  <code>
                    little-bootstrapper rules [--search &lt;q&gt;] [--install &lt;ids&gt;]
                  </code>{' '}
                  — Rules Marketplace (<code>ink-anti-patterns</code>,{' '}
                  <code>nextjs-anti-patterns</code>, <code>mobile-anti-patterns</code>,{' '}
                  <code>financial-rules</code>, and more).
                </p>
                <p>
                  <code>
                    little-bootstrapper mcps [--recommend] [--search &lt;q&gt;] [--install
                    &lt;ids&gt;]
                  </code>{' '}
                  — Verified Safe MCP Marketplace (26 audited MCPs) installed cleanly into{' '}
                  <code>mcp.json</code>.
                </p>
                <p>
                  <code>little-bootstrapper normalize</code> — Detects installed
                  tools/agents/MCPs/rules, picks the normalizing AI agent, and syncs missing skills
                  &amp; security configs.
                </p>
                <p>
                  <code>little-bootstrapper update [--apply]</code> — Audits all{' '}
                  <code>package.json</code> files, flags CVEs &amp; unpinned ranges, and pins latest
                  audited releases.
                </p>
                <p>
                  <code>little-bootstrapper generate &lt;module&gt;</code> — Generates a module
                  following <code>bootstrap.config.json</code>.
                </p>
              </div>
            </div>
          </CardSpotlight>

          <CardSpotlight id="starter-product">
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-bold text-teal-600 dark:text-teal-400">
                  <Package className="h-5 w-5" />
                  Initialized Starter Product &amp; UI Separation
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Every app &amp; package initialized with clean structure + tests
                </p>
              </div>
              <div className="space-y-2.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <p>
                  <code>packages/contracts</code> — Sample Contract (
                  <code>HealthResponseSchema</code> &amp; <code>createHealthPayload()</code>) shared
                  cleanly across backend &amp; web.
                </p>
                <p>
                  <code>apps/api</code> — Backend service in your chosen framework exposing{' '}
                  <code>GET /health</code> backed by <code>@&lt;repo&gt;/contracts</code>.
                </p>
                <p>
                  <code>apps/web</code> — Web Sample App displaying your chosen parameters and live{' '}
                  <code>/health</code> status.
                </p>
                <p>
                  <code>packages/ui-cli</code>, <code>packages/ui-web</code>,{' '}
                  <code>packages/ui-mobile</code> — Platform-specific separated UI packages.
                </p>
              </div>
            </div>
          </CardSpotlight>

          <CardSpotlight id="ai-ecosystem">
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-bold text-teal-600 dark:text-teal-400">
                  <Cpu className="h-5 w-5" />
                  Universal AI Ecosystem
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Context-selective rules + skills across 5 AI agents
                </p>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <p>
                  Canonical rules live in <code>.ai/rules/</code> and skills in{' '}
                  <code>.ai/skills/</code>, bridged identically to Open Code, Antigravity, Claude,
                  Codex, and Cursor:
                </p>
                <p className="font-mono text-xs text-teal-600 dark:text-teal-400">
                  AGENTS.md • CLAUDE.md • .agent/rules/ • .cursor/rules/ • .opencode/ • .codex/
                </p>
              </div>
            </div>
          </CardSpotlight>

          <CardSpotlight id="security">
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-bold text-teal-600 dark:text-teal-400">
                  <Shield className="h-5 w-5" />
                  Aceternity Pro &amp; Security Policy
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pro Registry: {proStatus.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <p>
                  Configure <code>ACETERNITY_PRO_API_KEY</code> and{' '}
                  <code>ACETERNITY_PRO_LICENSE_KEY</code> in <code>.env.local</code> (see{' '}
                  <code>.env.example</code>).
                </p>
                <p>
                  Run OpenGrep (<code>.opengrep.yml</code>) + GitLeaks (<code>.gitleaks.toml</code>)
                  and keep all dependencies strictly pinned. Linter and Prettier live strictly at
                  the repository root.
                </p>
              </div>
            </div>
          </CardSpotlight>
        </div>

        <Card id="native-commands">
          <CardHeader>
            <CardTitle>Native workspace commands</CardTitle>
            <CardDescription>
              One command interface for Go, Rust, and Solidity workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              Every native app and package gets a Makefile with <code>build</code>,{' '}
              <code>start</code>, <code>dev</code>, and <code>test</code>. Bare <code>make</code>{' '}
              runs tests, both in a workspace and at the root.
            </p>
            <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-teal-300">{`make                         # Test native workspaces
make build                   # Build native workspaces
make start                   # Start executables / local contract nodes
make dev                     # Local development
make test-packages-core      # Target packages/core
make build-apps-api           # Target apps/api`}</pre>
            <p>
              Root start and dev commands run workspaces in parallel. Libraries have no executable:
              their start target explains this, and their dev target runs tests. Root start skips
              libraries. JavaScript workspaces keep their package-manager commands.
            </p>
          </CardContent>
        </Card>

        {/* Outside Delivery Pipeline Reference */}
        <Card id="delivery-pipeline">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Workflow className="h-5 w-5" />
              External Delivery Pipeline (scripts/pipeline.sh &amp; docs/PIPELINE.md)
            </CardTitle>
            <CardDescription>
              Every scaffolded repository ships a standalone outside pipeline script and dedicated
              pipeline documentation so builds, formatting, linting, tests, and pattern checks run
              identically locally and in CI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-teal-300">
              {`# Run the complete external pipeline outside the CLI
./scripts/pipeline.sh --all

# Or target individual stages:
./scripts/pipeline.sh --install   # Install & link workspaces (packages/* -> apps/*)
./scripts/pipeline.sh --check     # Root Prettier format:check + root-only linter + typecheck
./scripts/pipeline.sh --build     # Build contracts -> UI packages -> API -> Web sample app
./scripts/pipeline.sh --test      # Run unit/integration tests + little-bootstrapper validate`}
            </pre>
          </CardContent>
        </Card>

        {/* Atomic Modular CLI Architecture Guide for Projects (Aceternity GlowingEffect) */}
        <div
          id="blueprint"
          className="relative rounded-3xl border border-zinc-200/80 p-2 dark:border-zinc-800/80"
        >
          <GlowingEffect spread={40} glow disabled={false} proximity={64} borderWidth={2} />
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Layers className="h-5 w-5" />
                Atomic Modular Unit Architecture (Reference Blueprint)
              </CardTitle>
              <CardDescription>
                Every major domain unit is completely isolated so you can swap or modify one
                command, module, or screen without affecting sibling code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-teal-300">
                {`src/
├── cli.tsx                   # Thin entrypoint delegating to commands/
├── commands/                 # Isolated CLI command handlers (1 file per command)
│   ├── args.ts               # Pure argv/flag parser
│   ├── init.command.ts
│   ├── mcps.command.ts
│   ├── normalize.command.ts
│   ├── update.command.ts
│   └── generate.command.ts
├── modules/                  # Independently swappable domain units (barrel-only imports)
│   ├── architecture/         # Compatibility rules, naming & preview + __tests__/
│   ├── catalog/              # Stack catalog, audited versions & safe MCPs + __tests__/
│   ├── validation/           # Zod schemas for CLI args, TUI inputs & config + __tests__/
│   ├── generators/           # Project, workspace, pipeline, AI ecosystem & mcp.json + __tests__/
│   └── workflows/            # Normalize & Update Helper orchestration + __tests__/
├── ui/screens/               # Isolated interactive screens (1 screen per workflow)
├── types/                    # Pure domain contracts split by bounded context
└── assets/ascii/             # Decoupled static visual assets
tests/e2e/                    # Root E2E suite exclusively`}
              </pre>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This structure is automatically embedded into{' '}
                <code>.ai/rules/project-architecture.md</code> for all bootstrapped repositories so
                Open Code, Antigravity, Claude, Codex, and Cursor maintain strict unit boundaries.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive ShadCN Accordion for Architecture Patterns */}
        <Card id="architecture-patterns">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-500" />
              Architecture Patterns &amp; Compatibility Guide
            </CardTitle>
            <CardDescription>
              Click any pattern below to see its compatible folder organizations and layout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="modular">
              <AccordionItem value="modular">
                <AccordionTrigger>Modular Architecture (Default)</AccordionTrigger>
                <AccordionContent>
                  Independent modules under <code>src/modules/&lt;name&gt;/</code> with explicit
                  boundaries and optional barrel exports (<code>index.ts</code>). Compatible with{' '}
                  <code>module-based</code> and <code>feature-based</code> folder organization.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="hexagonal">
                <AccordionTrigger>Ports &amp; Adapters (Hexagonal)</AccordionTrigger>
                <AccordionContent>
                  Separates pure domain entities (<code>src/domain/</code>) from ports (
                  <code>src/ports/</code>) and external adapters (<code>src/adapters/</code>).
                  Compatible with <code>layer-based</code> and <code>module-based</code>{' '}
                  organization.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="clean">
                <AccordionTrigger>Clean Architecture</AccordionTrigger>
                <AccordionContent>
                  Organizes code around <code>entities/</code>, <code>use-cases/</code>,{' '}
                  <code>interfaces/</code>, and <code>infrastructure/</code>.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vertical">
                <AccordionTrigger>Vertical Slice Architecture</AccordionTrigger>
                <AccordionContent>
                  Groups handlers, schemas, and tests together per feature under{' '}
                  <code>src/features/&lt;name&gt;/</code>.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
