'use client';

import React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  CardSpotlight,
  Badge,
} from '@little-bootstrapper/ui-web';
import { Rocket, Wrench, ShieldCheck } from 'lucide-react';

export function CliWorkflowsTabs() {
  return (
    <Tabs defaultValue="init" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="init" data-testid="tab-init">
          <Rocket className="mr-1.5 h-3.5 w-3.5" />
          Initialize Setup
        </TabsTrigger>
        <TabsTrigger value="normalize" data-testid="tab-normalize">
          <Wrench className="mr-1.5 h-3.5 w-3.5" />
          Normalize Setup
        </TabsTrigger>
        <TabsTrigger value="update" data-testid="tab-update">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          Update Helper
        </TabsTrigger>
      </TabsList>

      <TabsContent value="init">
        <CardSpotlight>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">CORE: Initialize Setup</h3>
            <Badge>little-bootstrapper init</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Interactive React Ink wizard covering Repo Info &amp; CODEOWNERS, Polyglot Stack
            (TypeScript, Go, Rust, Solidity + Bun-only Elysia guard), Apps &amp; Packages Editor,
            automatic UI package separation (<code>packages/ui-cli</code>,{' '}
            <code>packages/ui-web</code>, <code>packages/ui-mobile</code>), and Architecture
            Selector with live folder tree preview.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950/90 p-4 font-mono text-xs text-teal-300">
            {`$ little-bootstrapper init
✔ Repo Info: planet-express-app (@fry, CODEOWNERS enabled)
✔ Stack: TypeScript + Go | Yarn | NX Monorepo + Makefile
✔ Separated UI Packages: packages/ui-cli, packages/ui-web, packages/ui-mobile
✔ Architecture: Modular / module-based / kebab-case / colocated tests
✔ Universal AI Agents: Open Code, Antigravity, Claude, Codex, Cursor`}
          </pre>
        </CardSpotlight>
      </TabsContent>

      <TabsContent value="normalize">
        <CardSpotlight color="rgba(132, 204, 22, 0.22)">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Normalize Existing Setup</h3>
            <Badge variant="lime">little-bootstrapper normalize</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Scans any existing repository to detect installed tools, AI agents, security configs,
            and UI packages. Select the normalizing AI agent, pick which tools/skills to add or
            keep, and sync <code>.ai/</code> + all 5 agent bridges automatically.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950/90 p-4 font-mono text-xs text-lime-300">
            {`$ little-bootstrapper normalize --agent claude --apply
✔ Detected: 2 agents, 3 tools, 9 missing universal rules
✔ Synced: .ai/rules/* (15), .ai/skills/* (7), .opengrep.yml, .gitleaks.toml
✔ Generated: .ai/normalization-plan.md for Claude`}
          </pre>
        </CardSpotlight>
      </TabsContent>

      <TabsContent value="update">
        <CardSpotlight color="rgba(56, 189, 248, 0.22)">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Update Helper (Audited &amp; Pinned)</h3>
            <Badge variant="steel">little-bootstrapper update --apply</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Audits every <code>package.json</code> in the monorepo, flags unpinned ranges (
            <code>^</code> / <code>~</code>) and known CVEs (like CVE-2025-66478), and pins all
            dependencies to exact audited versions.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950/90 p-4 font-mono text-xs text-sky-300">
            {`$ little-bootstrapper update --apply
✖ apps/web/package.json: next (15.3.2 → 15.5.29) [vulnerable: CVE-2025-66478]
✖ package.json: typescript (^5.0.0 → 5.8.3) [unpinned]
✔ Audited 42 dependencies; pinned & upgraded 2 packages cleanly.`}
          </pre>
        </CardSpotlight>
      </TabsContent>
    </Tabs>
  );
}
