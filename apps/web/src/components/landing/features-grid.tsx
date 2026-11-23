import React from 'react';
import { GlowingEffect, Badge } from '@little-bootstrapper/ui-web';
import { Boxes, BrainCircuit, Layers, ShieldCheck, PlugZap } from 'lucide-react';

interface Feature {
  area: string;
  tag: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  extra?: React.ReactNode;
}

const UI_PACKAGES = ['packages/ui-cli', 'packages/ui-web', 'packages/ui-mobile'];
const AGENT_BRIDGES = ['AGENTS.md', 'CLAUDE.md', '.agent/', '.cursor/rules/', '.opencode/'];
const VERIFIED_MCPS = [
  'nx',
  'nextjs-devtools',
  'shadcn',
  'playwright',
  'context7',
  'stripe',
  'drizzle',
  'postgres',
];

const ARCHITECTURE_TREE = `src/
├── commands/    # 1 file / cmd
├── modules/
│   ├── architecture/
│   ├── catalog/
│   ├── generators/
│   └── workflows/
├── ui/screens/
└── types/`;

const FEATURES: Feature[] = [
  {
    area: 'md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]',
    tag: 'Monorepo UI',
    icon: <Boxes className="h-4 w-4" />,
    title: 'Three Platform-Specific UI Packages',
    description:
      'Separates React Ink CLI widgets, ShadCN + Aceternity web primitives, and mobile UI (scaffolded when React Native or Lynx is selected).',
    extra: (
      <div className="flex flex-wrap gap-1.5 pt-2">
        {UI_PACKAGES.map((pkg) => (
          <span
            key={pkg}
            className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-teal-400"
          >
            {pkg}
          </span>
        ))}
      </div>
    ),
  },
  {
    area: 'md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]',
    tag: '5 AI Agents',
    icon: <BrainCircuit className="h-4 w-4" />,
    title: 'One Canonical .ai/ Brain',
    description:
      'Context-selective rules in .ai/rules/ and skills in .ai/skills/, bridged identically to Open Code, Antigravity, Claude, Codex, and Cursor.',
    extra: (
      <div className="flex flex-wrap gap-1.5 pt-2">
        {AGENT_BRIDGES.map((bridge) => (
          <span
            key={bridge}
            className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            {bridge}
          </span>
        ))}
      </div>
    ),
  },
  {
    area: 'md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/9]',
    tag: '6 Patterns',
    icon: <Layers className="h-4 w-4" />,
    title: 'Clean Architecture Selector',
    description:
      'Standard, Layered, Modular, Hexagonal, Clean, or Vertical Slice — preview the exact folder tree before a single file is generated.',
    extra: (
      <pre className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-teal-300 dark:border-zinc-800">
        {ARCHITECTURE_TREE}
      </pre>
    ),
  },
  {
    area: 'md:[grid-area:2/7/3/13] xl:[grid-area:1/9/2/13]',
    tag: 'Zero ^ / ~',
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'Pinned & Audited Versions',
    description:
      'Zero unpinned ranges. The Update Helper flags known CVEs and pins every package.json to exact audited releases.',
    extra: (
      <div className="mt-2 rounded-lg border border-teal-500/25 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-teal-300">
        ✔ CVE-2025-66478 guarded • next@15.5.29 pinned
      </div>
    ),
  },
  {
    area: 'md:[grid-area:3/1/4/13] xl:[grid-area:2/9/3/13]',
    tag: '26 Safe MCPs',
    icon: <PlugZap className="h-4 w-4" />,
    title: 'Verified Safe MCP Marketplace',
    description:
      'Audited MCP servers installed cleanly into mcp.json with env-only secrets and zero hardcoded tokens.',
    extra: (
      <div className="flex flex-wrap gap-1.5 pt-2">
        {VERIFIED_MCPS.map((mcp) => (
          <span
            key={mcp}
            className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            {mcp}
          </span>
        ))}
      </div>
    ),
  },
];

function FeatureCard({ area, tag, icon, title, description, extra }: Feature) {
  return (
    <li className={`min-h-[15rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-zinc-200/80 p-1.5 dark:border-zinc-800/80 md:rounded-3xl md:p-2">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div className="relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-xl border border-zinc-200/60 bg-white/90 p-6 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/75">
          <div className="flex items-center justify-between gap-2">
            <div className="w-fit rounded-lg border border-teal-500/30 bg-teal-500/10 p-2 text-teal-600 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-teal-400">
              {icon}
            </div>
            <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {tag}
            </span>
          </div>
          <div className="space-y-2.5">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-xl">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
            {extra}
          </div>
        </div>
      </div>
    </li>
  );
}

export function FeaturesGrid() {
  return (
    <section
      id="features"
      className="border-t border-zinc-200/70 py-20 lg:py-24 dark:border-zinc-800/70"
    >
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <div className="space-y-3">
          <Badge>Mandatory Monorepo Separation</Badge>
          <h2 className="text-3xl font-medium tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            Everything your crew needs, delivered on day one
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Per-workspace tech selection, root-only linting with Prettier by default, and an outside
            delivery pipeline built right in.
          </p>
        </div>
        <ul className="grid grid-cols-1 grid-rows-none gap-5 md:grid-cols-12 md:grid-rows-3 xl:grid-rows-2">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </ul>
      </div>
    </section>
  );
}
