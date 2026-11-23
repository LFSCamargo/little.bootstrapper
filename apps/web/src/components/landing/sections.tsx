import {
  InfiniteMovingCards,
  CardSpotlight,
  Badge,
  AsciiFrame,
  BENDER_MASCOT_IMAGE,
  BackgroundBeamsWithCollision,
  MovingBorderButton,
  HeroHighlight,
  Highlight,
} from '@little-bootstrapper/ui-web';
import { Cpu, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

export const AGENTS = [
  { name: 'Open Code', config: 'AGENTS.md + .opencode/' },
  { name: 'Antigravity', config: '.agent/rules/ + .agent/skills/' },
  { name: 'Claude', config: 'CLAUDE.md + .claude/rules/' },
  { name: 'Codex', config: 'AGENTS.md + .codex/' },
  { name: 'Cursor', config: '.cursor/rules/universal.mdc' },
];

// Character references with product context, rather than fictional endorsements.
export const CREW_QUOTES = [
  {
    quote: '“Shut up and take my money!” — Fry. Keep the enthusiasm; the library is open source.',
    name: 'A nod to Fry',
    title: 'Start with an idea. Skip the repetitive setup.',
  },
  {
    quote:
      '“I’m back, baby!” — Bender. So is your project structure, every time you generate a module.',
    name: 'A nod to Bender',
    title: 'Consistent architecture, without rebuilding it by hand.',
  },
];

export function AgentsSection() {
  return (
    <section
      id="agents"
      className="space-y-12 border-t border-zinc-200/70 py-20 lg:py-24 dark:border-zinc-800/70"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="space-y-3">
          <Badge variant="steel">Context-selective rules • Skills • 1 Canonical .ai/</Badge>
          <h2 className="text-3xl font-medium tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            Your rules. Every agent.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {AGENTS.map((agent) => (
            <CardSpotlight key={agent.name} className="p-5">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Cpu className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">{agent.name}</span>
              </div>
              <p className="mt-2.5 break-words font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {agent.config}
              </p>
            </CardSpotlight>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden px-6" data-testid="crew-quotes">
        <InfiniteMovingCards
          items={CREW_QUOTES}
          direction="right"
          speed="slow"
          className="mx-auto"
        />
      </div>
    </section>
  );
}

export function BenderSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
      <HeroHighlight containerClassName="p-8 sm:p-12">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <AsciiFrame
              title="BENDER_MASCOT.ASCII"
              subtitle="Chief Scaffolding Officer"
              caption="Bite my shiny metal scaffold!"
              src={BENDER_MASCOT_IMAGE.src}
              alt={BENDER_MASCOT_IMAGE.alt}
              aspectClassName="aspect-square"
              accent="teal"
              resolution={76}
              charset="standard"
              inverted
              colored
              objectFit="contain"
              animationStyle="typewriter"
              animationDuration={1.4}
            />
          </div>
          <div className="space-y-6 lg:col-span-7">
            <Badge>
              <Layers className="h-3.5 w-3.5" />6 Architecture Patterns + Live Folder Preview
            </Badge>
            <h2 className="text-3xl font-medium tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Choose a structure. Keep it consistent.{' '}
              <Highlight>Keep dependencies pinned.</Highlight>
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Configure Standard, Layered, Modular, Hexagonal (Ports &amp; Adapters), Clean
              Architecture, or Vertical Slice. Preview your folder structure before generating a
              single file, persist every rule in <code>bootstrap.config.json</code>, and generate
              future modules matching your exact naming and test organization.
            </p>
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-500 dark:text-teal-400" />
              Zero unpinned ranges (no ^ or ~) • Active CVE checking via Update Helper
            </div>
          </div>
        </div>
      </HeroHighlight>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <BackgroundBeamsWithCollision className="h-[26rem] rounded-3xl border border-zinc-200/90 from-zinc-50 to-zinc-100 dark:border-zinc-800/90 dark:from-zinc-950 dark:to-zinc-900 md:h-[28rem]">
        <div className="relative z-20 flex flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-medium tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Your next project,{' '}
            <span className="text-teal-600 dark:text-teal-400">without the setup spiral.</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Start with the structure you need, share the rules your agents should follow, and spend
            your time on the code that matters.
          </p>
          <MovingBorderButton
            as="a"
            href="/docs"
            borderRadius="9999px"
            containerClassName="h-12 w-auto"
            borderClassName="bg-[radial-gradient(#2dd4bf_40%,transparent_60%)]"
            className="gap-2 border-zinc-800 bg-zinc-950 px-6 text-sm font-semibold text-zinc-50 hover:text-teal-300"
          >
            Read the docs <ArrowRight className="h-4 w-4 text-teal-400" />
          </MovingBorderButton>
        </div>
      </BackgroundBeamsWithCollision>
    </section>
  );
}
