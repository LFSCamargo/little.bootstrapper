import React from 'react';
import { Timeline, Badge, CardSpotlight } from '@little-bootstrapper/ui-web';

interface Workflow {
  step: string;
  heading: string;
  command: string;
  badgeVariant: 'default' | 'lime' | 'steel';
  glow: string;
  terminalColor: string;
  description: React.ReactNode;
  terminal: string;
}

const WORKFLOWS: Workflow[] = [
  {
    step: 'Initialize',
    heading: 'CORE: Initialize Setup',
    command: 'little-bootstrapper init',
    badgeVariant: 'default',
    glow: 'rgba(45, 212, 191, 0.14)',
    terminalColor: 'text-teal-300',
    description: (
      <>
        Interactive React Ink wizard with per-app &amp; per-package tech selection, root-only linter
        + Prettier default, starter product (Backend <code>/health</code>,{' '}
        <code>packages/contracts</code>, Web Sample App), and standalone{' '}
        <code>scripts/pipeline.sh</code>.
      </>
    ),
    terminal: `$ little-bootstrapper init
✔ Root Quality: ESLint (root only) + Prettier (root default)
✔ Workspaces: apps/api (Hono /health), apps/web (Next.js), packages/contracts (Zod)
✔ Separated UI: packages/ui-cli, packages/ui-web, packages/ui-mobile
✔ Pipeline: scripts/pipeline.sh + docs/PIPELINE.md
✔ Universal AI Agents: Open Code, Antigravity, Claude, Codex, Cursor`,
  },
  {
    step: 'Normalize',
    heading: 'Normalize Existing Setup',
    command: 'little-bootstrapper normalize',
    badgeVariant: 'steel',
    glow: 'rgba(45, 212, 191, 0.12)',
    terminalColor: 'text-zinc-200',
    description: (
      <>
        Scans any existing repository to detect installed tools, AI agents, security configs, and UI
        packages. Pick the normalizing AI agent, choose which tools and skills to add or keep, and
        sync <code>.ai/</code> + all 5 agent bridges automatically.
      </>
    ),
    terminal: `$ little-bootstrapper normalize --agent claude --apply
✔ Detected: 2 agents, 3 tools, 9 missing universal rules
✔ Synced: .ai/rules/*, .ai/skills/*, .opengrep.yml, .gitleaks.toml
✔ Generated: .ai/normalization-plan.md for Claude`,
  },
  {
    step: 'Update',
    heading: 'Update Helper (Audited & Pinned)',
    command: 'little-bootstrapper update --apply',
    badgeVariant: 'steel',
    glow: 'rgba(45, 212, 191, 0.12)',
    terminalColor: 'text-teal-300',
    description: (
      <>
        Audits every <code>package.json</code> in the monorepo, flags unpinned ranges (
        <code>^</code> / <code>~</code>) and known CVEs (like CVE-2025-66478), and pins all
        dependencies to exact audited versions.
      </>
    ),
    terminal: `$ little-bootstrapper update --apply
✖ apps/web/package.json: next (15.3.2 → 15.5.29) [vulnerable: CVE-2025-66478]
✖ package.json: typescript (^5.0.0 → 5.8.3) [unpinned]
✔ Audited 42 dependencies; pinned & upgraded 2 packages cleanly.`,
  },
];

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <CardSpotlight color={workflow.glow} className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{workflow.heading}</h3>
        <Badge variant={workflow.badgeVariant}>{workflow.command}</Badge>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {workflow.description}
      </p>
      <pre
        className={`mt-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed ${workflow.terminalColor}`}
      >
        {workflow.terminal}
      </pre>
    </CardSpotlight>
  );
}

export function WorkflowsTimeline() {
  return (
    <section
      id="workflows"
      className="border-t border-zinc-200/70 py-20 lg:py-24 dark:border-zinc-800/70"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Timeline
          badge={<Badge>3 Core Delivery Missions</Badge>}
          title="CLI Workflows"
          description="Scroll through the mission log: initialize a brand-new monorepo, normalize an existing one, then keep it audited and pinned forever."
          data={WORKFLOWS.map((workflow) => ({
            title: workflow.step,
            content: <WorkflowCard workflow={workflow} />,
          }))}
        />
      </div>
    </section>
  );
}
