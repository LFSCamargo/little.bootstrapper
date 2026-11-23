import {
  AsciiFrame,
  BackgroundBeamsWithCollision,
  BENDER_MASCOT_IMAGE,
  MovingBorderButton,
} from '@little-bootstrapper/ui-web';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-36">
      <BackgroundBeamsWithCollision className="h-auto min-h-[36rem] rounded-3xl border border-zinc-200/90 py-14 dark:border-zinc-800/90 dark:from-zinc-950 dark:to-zinc-900">
        <div className="relative z-20 grid items-center gap-10 px-6 md:grid-cols-2">
          <div className="space-y-5 text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400 sm:text-5xl">
              404 — Wrong Dimension!
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Good news, everyone! That delivery route doesn&apos;t exist in this universe.
            </p>
            <div>
              <MovingBorderButton
                as="a"
                href="/"
                borderRadius="9999px"
                containerClassName="h-12 w-auto"
                borderClassName="bg-[radial-gradient(#2dd4bf_40%,transparent_60%)]"
                className="border-zinc-800 bg-zinc-950 px-6 text-sm font-semibold text-zinc-50 hover:text-teal-300"
              >
                Back to little.bootstrapper
              </MovingBorderButton>
            </div>
          </div>
          <AsciiFrame
            title="BENDER_LOST.ASCII"
            subtitle="404 Signal Lost"
            src={BENDER_MASCOT_IMAGE.src}
            alt={BENDER_MASCOT_IMAGE.alt}
            aspectClassName="aspect-square"
            accent="teal"
            resolution={74}
            inverted
            colored
            objectFit="contain"
          />
        </div>
      </BackgroundBeamsWithCollision>
    </div>
  );
}
