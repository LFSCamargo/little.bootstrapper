'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const TracingBeam: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('relative mx-auto w-full max-w-5xl pl-6 sm:pl-10', className)}>
      <div
        aria-hidden="true"
        className="absolute left-1.5 top-2 bottom-2 w-[2px] overflow-hidden rounded-full bg-slate-300/60 dark:bg-slate-800 sm:left-3"
      >
        <motion.div
          className="h-32 w-full bg-gradient-to-b from-transparent via-teal-400 to-lime-400"
          animate={{ y: ['0%', '450%', '0%'] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div>{children}</div>
    </div>
  );
};
