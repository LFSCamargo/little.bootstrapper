import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-teal-300',
        lime: 'border-lime-500/35 bg-lime-500/15 text-lime-800 dark:border-lime-400/30 dark:text-lime-300',
        steel:
          'border-zinc-300/80 bg-zinc-100/90 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300',
        outline: 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200',
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
