import React from 'react';
import { cn } from '../lib/utils';

export const BentoGrid: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[minmax(13rem,auto)] md:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem: React.FC<{
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ className, title, description, header, icon }) => {
  return (
    <div
      className={cn(
        'group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-2xl border border-white/30 bg-white/65 p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-teal-400/50 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/55',
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-1">
        {icon}
        <div className="mb-1.5 mt-2 font-sans text-base font-bold text-slate-900 dark:text-slate-100">
          {title}
        </div>
        <div className="font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </div>
      </div>
    </div>
  );
};
