'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({
  data,
  badge,
  title,
  description,
  className,
}: {
  data: TimelineEntry[];
  badge?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setHeight(el.getBoundingClientRect().height);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 15%', 'end 55%'],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className={cn('w-full font-sans', className)} ref={containerRef}>
      {(badge || title || description) && (
        <div className="mb-10 space-y-3">
          {badge && <div>{badge}</div>}
          {title && (
            <h2 className="max-w-4xl text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-4xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      )}

      <div ref={ref} className="relative pb-8">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 first:pt-4 md:gap-10 md:pt-16 md:first:pt-6"
          >
            <div className="sticky top-28 z-30 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-[16rem]">
              <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#09090b]">
                <div className="h-3.5 w-3.5 rounded-full border border-teal-500/60 bg-teal-500/20 dark:border-teal-400/60 dark:bg-teal-400/20" />
              </div>
              <h3 className="hidden text-xl font-semibold tracking-tight text-zinc-500 dark:text-zinc-400 md:block md:pl-16 md:text-3xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-16 pr-0 md:pl-4">
              <h3 className="mb-4 block text-left text-2xl font-semibold text-zinc-600 dark:text-zinc-400 md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{
            height: `${height}px`,
          }}
          className="absolute left-8 top-0 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-zinc-300 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] dark:via-zinc-800"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-teal-400 via-teal-500/70 to-transparent from-[0%] via-[20%]"
          />
        </div>
      </div>
    </div>
  );
};
