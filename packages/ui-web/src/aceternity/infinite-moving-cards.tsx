'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

export const InfiniteMovingCards = ({
  items,
  direction = 'left',
  speed = 'fast',
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: 'left' | 'right';
  speed?: 'fast' | 'normal' | 'slow';
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const clonedRef = useRef(false);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    if (!container || !scroller) return;

    if (!clonedRef.current) {
      const scrollerContent = Array.from(scroller.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (duplicatedItem instanceof HTMLElement) {
          duplicatedItem.setAttribute('aria-hidden', 'true');
        }
        scroller.appendChild(duplicatedItem);
      });
      clonedRef.current = true;
    }

    container.style.setProperty(
      '--animation-direction',
      direction === 'left' ? 'forwards' : 'reverse',
    );
    container.style.setProperty(
      '--animation-duration',
      speed === 'fast' ? '20s' : speed === 'normal' ? '40s' : '70s',
    );
    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'scroller relative z-20 w-full max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]',
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4',
          start && 'animate-scroll',
          pauseOnHover && 'hover:[animation-play-state:paused]',
        )}
      >
        {items.map((item) => (
          <li
            className="relative w-[300px] max-w-full shrink-0 rounded-2xl border border-zinc-200/90 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-xl sm:w-[380px] md:w-[420px] dark:border-zinc-800/90 dark:bg-zinc-900/75"
            key={item.name}
          >
            <blockquote>
              <span className="relative z-20 text-sm leading-[1.65] font-normal text-zinc-700 dark:text-zinc-200">
                &ldquo;{item.quote}&rdquo;
              </span>
              <div className="relative z-20 mt-5 flex flex-row items-center gap-3 border-t border-zinc-200/80 pt-3 dark:border-zinc-800">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.title}</span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
