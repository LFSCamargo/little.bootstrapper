'use client';

import React, { useState } from 'react';
import { CardSpotlight } from '../aceternity/card-spotlight';
import { AsciiArt, type CharsetPreset } from '../aceternity/ascii-art';
import { cn } from '../lib/utils';

export interface AsciiFrameProps {
  title: string;
  /** Image URL rendered through the Aceternity `AsciiArt` filter. */
  src: string;
  alt: string;
  subtitle?: string;
  caption?: string;
  className?: string;
  /** Aspect ratio utility class for the ASCII canvas container (e.g. `aspect-[6/5]`, `aspect-square`). */
  aspectClassName?: string;
  accent?: 'teal' | 'lime';
  /** ASCII columns — higher means more detail. */
  resolution?: number;
  charset?: CharsetPreset | string;
  /** Keep the original image colours on every ASCII glyph. */
  colored?: boolean;
  inverted?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
  animationStyle?: 'fade' | 'typewriter' | 'matrix' | 'none';
  animationDuration?: number;
  /** Render interactive charset & color filter controls in the frame footer. */
  interactive?: boolean;
}

const ACCENT_TEXT: Record<NonNullable<AsciiFrameProps['accent']>, string> = {
  teal: '#5eead4',
  lime: '#bef264',
};

const FILTER_PRESETS: { id: CharsetPreset; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'dense', label: 'Dense' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'braille', label: 'Braille' },
];

export const AsciiFrame: React.FC<AsciiFrameProps> = ({
  title,
  src,
  alt,
  subtitle,
  caption,
  className,
  aspectClassName = 'aspect-square',
  accent = 'teal',
  resolution = 80,
  charset = 'standard',
  colored = true,
  inverted = false,
  objectFit = 'contain',
  animationStyle = 'matrix',
  animationDuration = 1.4,
  interactive = true,
}) => {
  const [activeCharset, setActiveCharset] = useState<string>(charset);
  const [isColored, setIsColored] = useState<boolean>(colored);
  const glowColor = 'rgba(45, 212, 191, 0.14)';

  return (
    <CardSpotlight
      color={glowColor}
      className={cn('p-4 font-mono', className)}
      data-testid="ascii-frame"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 pb-2.5 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400/80" />
          <span className="ml-1 truncate text-xs font-semibold tracking-wider text-zinc-700 dark:text-zinc-200">
            {title}
          </span>
        </div>
        {subtitle && (
          <span className="shrink-0 rounded-full border border-zinc-200 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {subtitle}
          </span>
        )}
      </div>

      <AsciiArt
        src={src}
        alt={alt}
        resolution={resolution}
        charset={activeCharset}
        colored={isColored}
        inverted={inverted}
        objectFit={objectFit}
        color={ACCENT_TEXT[accent]}
        backgroundColor="#09090b"
        animationStyle={animationStyle}
        animationDuration={animationDuration}
        className={cn('w-full rounded-xl ring-1 ring-zinc-800', aspectClassName)}
      />

      {interactive && (
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800"
          role="group"
          aria-label={`ASCII filter controls for ${title}`}
        >
          <div className="flex flex-wrap items-center gap-1">
            {FILTER_PRESETS.map((preset) => {
              const selected = activeCharset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setActiveCharset(preset.id)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-medium transition',
                    selected
                      ? 'bg-teal-500/15 text-teal-700 ring-1 ring-teal-500/40 dark:bg-teal-400/15 dark:text-teal-300'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsColored((c) => !c)}
            aria-pressed={isColored}
            className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:border-teal-400/50 dark:border-zinc-800 dark:text-zinc-300"
          >
            {isColored ? 'Color' : 'Mono'}
          </button>
        </div>
      )}

      {caption && (
        <p className="mt-2.5 border-t border-zinc-200/80 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {caption}
        </p>
      )}
    </CardSpotlight>
  );
};
