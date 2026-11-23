import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-teal-500/35 bg-teal-500/15 text-teal-800 dark:border-teal-400/30 dark:text-teal-300',
        lime: 'border-lime-500/35 bg-lime-500/15 text-lime-800 dark:border-lime-400/30 dark:text-lime-300',
        steel:
          'border-slate-400/40 bg-slate-500/15 text-slate-700 dark:border-slate-500/35 dark:text-slate-300',
        outline: 'border-black/15 text-slate-700 dark:border-white/20 dark:text-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
