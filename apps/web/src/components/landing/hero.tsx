import {
  SpotlightNew,
  StarsBackground,
  ShootingStars,
  FlipWords,
  TextGenerateEffect,
  MovingBorderButton,
  AsciiFrame,
  Badge,
  PLANET_EXPRESS_SHIP_IMAGE,
} from '@little-bootstrapper/ui-web';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CopyCommandPill } from './copy-command-pill';

export const HERO_AGENTS = ['Open Code', 'Antigravity', 'Claude', 'Codex', 'Cursor'];

const METRICS = [
  { value: '5', label: 'Universal AI Agents' },
  { value: '28', label: 'Context-Selective Rules' },
  { value: '26', label: 'Verified Safe MCPs' },
  { value: '6', label: 'Architecture Patterns' },
  { value: '0', label: 'Unpinned Ranges' },
];

const TEAL_SPOTLIGHT = {
  gradientFirst:
    'radial-gradient(65% 65% at 50% 25%, hsla(172, 72%, 55%, .07) 0, hsla(172, 72%, 45%, .02) 50%, transparent 80%)',
  gradientSecond: 'radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .03) 0, transparent 80%)',
  gradientThird: 'radial-gradient(50% 50% at 50% 50%, hsla(172, 72%, 55%, .04) 0, transparent 80%)',
};

export function Hero({ proEnabled }: { proEnabled: boolean }) {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="hero-heading"
      data-testid="hero"
    >
      {/* Clean grayscale atmospheric grid with subtle little.bootstrapper Teal spotlight */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <SpotlightNew {...TEAL_SPOTLIGHT} />
        <div className="hidden dark:block">
          <StarsBackground starDensity={0.0001} />
          <ShootingStars starColor="#2dd4bf" trailColor="#52525b" minDelay={2400} maxDelay={5200} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(24,24,27,0.08)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-40 lg:pb-24 lg:pt-48">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-7 lg:col-span-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge>
                <Sparkles className="h-3.5 w-3.5" />
                Good news, everyone! v1.0.0
              </Badge>
              <Badge variant="steel">
                Aceternity UI Pro: {proEnabled ? 'Ready (.env)' : 'Disabled'}
              </Badge>
            </div>

            <h1
              id="hero-heading"
              className="text-4xl font-medium tracking-[-0.06em] text-zinc-950 dark:text-zinc-50 sm:text-5xl lg:text-[3.5rem] lg:leading-[0.95]"
            >
              Less setup.{' '}
              <span className="font-serif font-normal tracking-[-0.05em] italic text-teal-600 dark:text-teal-400">
                More building.
              </span>
            </h1>

            <div className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 sm:text-2xl">
              Shared project rules for
              <FlipWords
                words={HERO_AGENTS}
                duration={2200}
                className="font-mono text-teal-600 dark:text-teal-400"
              />
            </div>

            <TextGenerateEffect
              words="little.bootstrapper is a library and CLI for starting polyglot monorepos with shared AI rules, clear architecture, and pinned dependencies. Pick your stack, preview the structure, and get back to building."
              className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg"
            />

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <MovingBorderButton
                as="a"
                href="/docs"
                borderRadius="9999px"
                duration={3600}
                containerClassName="h-12 w-auto"
                borderClassName="bg-[radial-gradient(#2dd4bf_40%,transparent_60%)]"
                className="gap-2 border-zinc-800 bg-zinc-950 px-6 text-sm font-semibold text-zinc-50 hover:text-teal-300"
              >
                Explore Docs <ArrowRight className="h-4 w-4 text-teal-400" />
              </MovingBorderButton>
              <CopyCommandPill command="npx little-bootstrapper init" />
            </div>
          </div>

          <div className="lg:col-span-6">
            <AsciiFrame
              title="FUTURAMA_SHIP.ASCII"
              subtitle="Aceternity ASCII Filter"
              caption="A little Futurama inspiration. A lot less repetitive setup."
              src={PLANET_EXPRESS_SHIP_IMAGE.src}
              alt={PLANET_EXPRESS_SHIP_IMAGE.alt}
              aspectClassName="aspect-[6/5]"
              accent="teal"
              resolution={82}
              charset="standard"
              inverted={false}
              colored
              objectFit="contain"
              animationStyle="matrix"
              animationDuration={1.4}
            />
          </div>
        </div>

        {/* Marketing Metrics Strip */}
        <dl className="mt-20 grid grid-cols-2 divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200/90 bg-zinc-50/85 backdrop-blur-xl sm:grid-cols-5 sm:divide-x sm:divide-y-0 dark:divide-zinc-800/90 dark:border-zinc-800/90 dark:bg-zinc-900/60">
          {METRICS.map((item) => (
            <div key={item.label} className="space-y-1.5 px-5 py-6 text-center">
              <dt className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                {item.label}
              </dt>
              <dd className="font-mono text-2xl font-bold text-teal-600 sm:text-3xl dark:text-teal-400">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
