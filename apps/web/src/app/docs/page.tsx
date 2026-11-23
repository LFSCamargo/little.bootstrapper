import {
  TracingBeam,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Separator,
  getAceternityProStatus,
} from '@little-bootstrapper/ui-web';
import { Terminal, Shield, Layers, Cpu, Package } from 'lucide-react';

export default function DocsPage() {
  const proStatus = getAceternityProStatus();

  return (
    <TracingBeam className="space-y-10 py-4">
      <div className="space-y-3">
        <Badge>Planet Express Operations Manual</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">Documentation</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-300">
          Complete reference for <code>little.bootstrapper</code> — CLI workflows, UI package
          separation, universal AI agent setup, architecture selector, and Aceternity UI Pro
          configuration.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Terminal className="h-5 w-5" />
              CLI Commands
            </CardTitle>
            <CardDescription>Interactive React Ink TUI + CI-ready flags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <code>little-bootstrapper init [--domains financial]</code> — CORE Initialize Setup
              wizard with context-selective framework, language &amp; domain rules.
            </p>
            <p>
              <code>little-bootstrapper rules [--search &lt;q&gt;] [--install &lt;ids&gt;]</code> —
              Rules Marketplace (<code>ink-anti-patterns</code>, <code>nextjs-anti-patterns</code>,{' '}
              <code>mobile-anti-patterns</code>, <code>financial-rules</code>, and more).
            </p>
            <p>
              <code>
                little-bootstrapper mcps [--recommend] [--search &lt;q&gt;] [--install &lt;ids&gt;]
              </code>{' '}
              — Verified Safe MCP Marketplace (26 audited MCPs: Nx, Next.js DevTools, ShadCN,
              Playwright, Context7, Stripe, Drizzle, Postgres, MongoDB, Tailwind, ESLint &amp; more)
              installed cleanly into <code>mcp.json</code>.
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lime-600 dark:text-lime-400">
              <Package className="h-5 w-5" />
              Separated UI Packages
            </CardTitle>
            <CardDescription>Enforced during initialization &amp; AI rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <code>packages/ui-cli</code> — Shared React Ink CLI UI components (banners,
              multi-selects, ASCII frames, folder previews).
            </p>
            <p>
              <code>packages/ui-web</code> — Shared ShadCN + Aceternity UI Web components (with Pro
              registry headers configured via <code>.env</code>).
            </p>
            <p>
              <code>packages/ui-mobile</code> — Shared React Native / Lynx mobile UI tokens and
              cross-platform primitives.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Cpu className="h-5 w-5" />
              Universal AI Ecosystem
            </CardTitle>
            <CardDescription>15 rules + 7 skills across 5 AI agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>
              Canonical rules live in <code>.ai/rules/</code> and skills in <code>.ai/skills/</code>
              , bridged identically to Open Code, Antigravity, Claude, Codex, and Cursor:
            </p>
            <p className="font-mono text-xs text-teal-700 dark:text-teal-300">
              AGENTS.md • CLAUDE.md • .agent/rules/ • .cursor/rules/ • .opencode/ • .codex/
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Shield className="h-5 w-5" />
              Aceternity Pro &amp; Security Policy
            </CardTitle>
            <CardDescription>
              Pro Registry: {proStatus.enabled ? 'Enabled' : 'Disabled'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>
              Configure <code>ACETERNITY_PRO_API_KEY</code> and{' '}
              <code>ACETERNITY_PRO_LICENSE_KEY</code> in <code>.env.local</code> (see{' '}
              <code>.env.example</code>).
            </p>
            <p>
              Run OpenGrep (<code>.opengrep.yml</code>) + GitLeaks (<code>.gitleaks.toml</code>) and
              keep all dependencies strictly pinned.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atomic Modular CLI Architecture Guide for Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Layers className="h-5 w-5" />
            Atomic Modular Unit Architecture (Reference Blueprint)
          </CardTitle>
          <CardDescription>
            Every major domain unit is completely isolated so you can swap or modify one command,
            module, or screen without affecting sibling code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-xl bg-slate-950/90 p-4 font-mono text-xs text-teal-300">
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
│   ├── generators/           # Project, module, AI ecosystem & mcp.json + __tests__/
│   └── workflows/            # Normalize & Update Helper orchestration + __tests__/
├── ui/screens/               # Isolated interactive screens (1 screen per workflow)
├── types/                    # Pure domain contracts split by bounded context
└── assets/ascii/             # Decoupled static visual assets
tests/e2e/                    # Root E2E suite exclusively`}
          </pre>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This structure is automatically embedded into{' '}
            <code>.ai/rules/project-architecture.md</code> for all bootstrapped repositories so Open
            Code, Antigravity, Claude, Codex, and Cursor maintain strict unit boundaries.
          </p>
        </CardContent>
      </Card>

      {/* Interactive ShadCN Accordion for Architecture Patterns */}
      <Card>
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
                Compatible with <code>layer-based</code> and <code>module-based</code> organization.
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
    </TracingBeam>
  );
}
