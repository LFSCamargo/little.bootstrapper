'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface HoverBorderGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  containerClassName?: string;
  duration?: number;
}

export const HoverBorderGradient: React.FC<HoverBorderGradientProps> = ({
  children,
  containerClassName,
  className,
  duration = 4,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative inline-flex overflow-hidden rounded-2xl p-[1.5px] shadow-lg shadow-teal-500/15',
        containerClassName,
      )}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-[-100%]"
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'conic-gradient(from 0deg, #2dd4bf 0%, #52525b 40%, #14b8a6 75%, #2dd4bf 100%)',
        }}
      />
      <div
        className={cn(
          'relative z-10 inline-flex items-center gap-2 rounded-[14px] bg-white/95 px-4 py-2 text-sm font-semibold text-zinc-900 backdrop-blur-xl dark:bg-zinc-950/95 dark:text-zinc-100',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
