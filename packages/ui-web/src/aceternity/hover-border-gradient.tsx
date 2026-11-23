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
            'conic-gradient(from 0deg, #14b8a6 0%, #a3e635 35%, #38bdf8 70%, #14b8a6 100%)',
        }}
      />
      <div
        className={cn(
          'relative z-10 inline-flex items-center gap-2 rounded-[14px] bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 backdrop-blur-xl dark:bg-slate-950/90 dark:text-teal-200',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
