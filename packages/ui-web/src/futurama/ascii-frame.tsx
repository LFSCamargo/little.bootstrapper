'use client';

import React from 'react';
import { CardSpotlight } from '../aceternity/card-spotlight';
import { cn } from '../lib/utils';

export interface AsciiFrameProps {
  title: string;
  art: string;
  subtitle?: string;
  caption?: string;
  className?: string;
  accent?: 'teal' | 'lime';
}

export const AsciiFrame: React.FC<AsciiFrameProps> = ({
  title,
  art,
  subtitle,
  caption,
  className,
  accent = 'teal',
}) => {
  const glowColor = accent === 'lime' ? 'rgba(132, 204, 22, 0.24)' : 'rgba(45, 212, 191, 0.24)';

  return (
    <CardSpotlight color={glowColor} className={cn('p-5 font-mono', className)}>
      <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2.5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-semibold tracking-wider text-slate-700 dark:text-teal-300">
            {title}
          </span>
        </div>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto text-[10px] leading-[1.25] text-teal-900 dark:text-teal-300 sm:text-xs">
        {art}
      </pre>
      {caption && (
        <p className="mt-3 border-t border-black/10 pt-2 text-[11px] text-slate-600 dark:border-white/10 dark:text-slate-400">
          {caption}
        </p>
      )}
    </CardSpotlight>
  );
};
