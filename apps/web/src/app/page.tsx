import Link from 'next/link';
import {
  Spotlight,
  BackgroundBeams,
  HoverBorderGradient,
  BentoGrid,
  BentoGridItem,
  CardSpotlight,
  TextGenerateEffect,
  AsciiFrame,
  Button,
  Badge,
  Separator,
  PLANET_EXPRESS_SHIP_ASCII,
  BENDER_MASCOT_ASCII,
  getAceternityProStatus,
} from '@little-bootstrapper/ui-web';
import {
  ShieldCheck,
  Layers,
  Cpu,
  Sparkles,
  ArrowRight,
  Terminal,
  Smartphone,
  Globe,
  Command,
} from 'lucide-react';
import { CliWorkflowsTabs } from '@/components/cli-workflows-tabs';

const AGENTS = [
  { name: 'Open Code', config: 'AGENTS.md + .opencode/' },
  { name: 'Antigravity', config: '.agent/rules/ + .agent/skills/' },
  { name: 'Claude', config: 'CLAUDE.md + .claude/rules/' },
  { name: 'Codex', config: 'AGENTS.md + .codex/' },
  { name: 'Cursor', config: '.cursor/rules/universal.mdc' },
];

const UI_PACKAGES = [
  {
    name: 'packages/ui-cli',
    title: 'CLI UI Package',
    desc: 'Reusable React Ink banners, MultiSelect prompts, FolderPreview trees, and Futurama terminal widgets.',
    icon: <Command className="h-5 w-5 text-teal-400" />,
    tag: 'React Ink',
  },
  {
    name: 'packages/ui-web',
    title: 'Web UI Package',
    desc: 'ShadCN Radix primitives + Aceternity UI liquid glassy effects (Pro keys via .env) shared across web apps.',
    icon: <Globe className="h-5 w-5 text-lime-400" />,
    tag: 'ShadCN + Aceternity UI',
  },
  {
    name: 'packages/ui-mobile',
    title: 'Mobile UI Package (On Init)',
    desc: 'Auto-scaffolded during initialization whenever React Native or Lynx is selected (NativeWind, UniWind, UniStyles, Tamagui).',
    icon: <Smartphone className="h-5 w-5 text-sky-400" />,
    tag: 'Init Scaffold • Mobile',
  },
];

export default function HomePage() {
  const proStatus = getAceternityProStatus();

  return (
    <div className="relative space-y-20">
      {/* Aceternity UI Atmospheric Hero Backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-40" fill="#2dd4bf" />
        <BackgroundBeams className="opacity-70" />
      </div>

      {/* Hero Section */}
      <section className="grid items-center gap-10 pt-2 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>
              <Sparkles className="h-3.5 w-3.5" />
              Good news, everyone! v1.0.0
            </Badge>
            <Badge variant="lime">
              Aceternity UI Pro: {proStatus.enabled ? 'Ready (.env)' : 'Disabled'}
            </Badge>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Planet Express{' '}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-lime-400 bg-clip-text text-transparent">
              AI Initializer
            </span>
          </h1>

          <TextGenerateEffect
            words="Bootstrap polyglot NX monorepos with separated UI packages, audited pinned versions, and one universal brain across Open Code, Antigravity, Claude, Codex, and Cursor."
            className="text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/docs">
                Explore Docs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HoverBorderGradient>
              <Terminal className="h-4 w-4 text-teal-500" />
              <span className="font-mono text-xs sm:text-sm">yarn cli</span>
            </HoverBorderGradient>
          </div>
        </div>

        <div className="lg:col-span-6">
          <AsciiFrame
            title="PLANET_EXPRESS_SHIP.ASCII"
            subtitle="asciiart.website/art/4158"
            caption="Good news, everyone! Our crew is replaceable. Your boilerplate isn't."
            art={PLANET_EXPRESS_SHIP_ASCII}
          />
        </div>
      </section>

      <Separator />

      {/* Interactive CLI Workflows Showcase (ShadCN Tabs + Aceternity CardSpotlight) */}
      <section className="space-y-6" id="workflows">
        <div className="space-y-2">
          <Badge variant="lime">3 Core Delivery Missions</Badge>
          <h2 className="text-3xl font-bold tracking-tight">CLI Workflows</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Switch tabs to preview Initialize Setup, Normalize Existing Setup, and Update Helper.
          </p>
        </div>
        <CliWorkflowsTabs />
      </section>

      {/* Separated UI Packages (ui-cli, ui-web, ui-mobile) */}
      <section className="space-y-6">
        <div className="space-y-2">
          <Badge>Mandatory Monorepo Separation</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Three Platform-Specific UI Packages</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Every bootstrapped monorepo automatically separates CLI, Web, and Mobile UI primitives.
          </p>
        </div>
        <BentoGrid>
          {UI_PACKAGES.map((pkg) => (
            <BentoGridItem
              key={pkg.name}
              title={pkg.title}
              description={pkg.desc}
              icon={pkg.icon}
              header={
                <div className="flex items-center justify-between rounded-xl border border-white/20 bg-slate-950/80 px-3 py-2 font-mono text-xs text-teal-300">
                  <span>{pkg.name}</span>
                  <Badge variant="lime" className="px-2 py-0.5 text-[10px]">
                    {pkg.tag}
                  </Badge>
                </div>
              }
            />
          ))}
        </BentoGrid>
      </section>

      {/* Universal 5 AI Agents */}
      <section className="space-y-6">
        <div className="space-y-2">
          <Badge variant="steel">15 Rules • 7 Skills • 1 Canonical .ai/</Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            One Canonical Brain. Five AI Agents.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {AGENTS.map((agent) => (
            <CardSpotlight key={agent.name} className="p-4">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Cpu className="h-4 w-4" />
                <span className="font-semibold">{agent.name}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                {agent.config}
              </p>
            </CardSpotlight>
          ))}
        </div>
      </section>

      {/* Bender Mascot + Architecture + Audited Versions */}
      <section className="grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AsciiFrame
            title="BENDER_MASCOT.ASCII"
            subtitle="Chief Scaffolding Officer"
            caption="Bite my shiny metal scaffold!"
            art={BENDER_MASCOT_ASCII}
            accent="lime"
          />
        </div>
        <div className="space-y-5 lg:col-span-7">
          <Badge variant="lime">
            <Layers className="h-3.5 w-3.5" />6 Architecture Patterns + Live Folder Preview
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            Clean Architecture, Naming Conventions &amp; Pinned Audited Versions
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Configure Standard, Layered, Modular, Hexagonal (Ports &amp; Adapters), Clean
            Architecture, or Vertical Slice. Preview your folder structure before generating a
            single file, persist every rule in <code>bootstrap.config.json</code>, and generate
            future modules matching your exact naming and test organization.
          </p>
          <div className="flex items-center gap-3 text-sm font-semibold text-teal-700 dark:text-teal-300">
            <ShieldCheck className="h-5 w-5 text-lime-500" />
            Zero unpinned ranges (no ^ or ~) • Active CVE checking via Update Helper
          </div>
          <div>
            <Button variant="outline" asChild>
              <Link href="/docs">Read Full Operations Manual →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
