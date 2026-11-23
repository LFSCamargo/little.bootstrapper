'use client';
import { cn } from '../lib/utils';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

import React, { useRef, useState } from 'react';

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ResizableNavbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 80) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.nav
      ref={ref}
      aria-label="Primary navigation"
      className={cn('fixed inset-x-0 top-4 z-50 w-full px-4', className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child,
      )}
    </motion.nav>
  );
};

export function getNavbarPillMetrics(visible: boolean) {
  return {
    desktopMaxWidth: visible ? '840px' : '1120px',
    mobileWidth: visible ? '94%' : '100%',
    translateY: 0,
    borderRadiusClass: 'rounded-full',
    backdropFilter: 'blur(16px)',
  };
}

export const NavBody = ({ children, className, visible = false }: NavBodyProps) => {
  const metrics = getNavbarPillMetrics(visible);
  return (
    <motion.div
      animate={{
        backdropFilter: metrics.backdropFilter,
        maxWidth: metrics.desktopMaxWidth,
        y: metrics.translateY,
      }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 34,
      }}
      className={cn(
        'relative z-[60] mx-auto hidden w-full flex-row items-center justify-between self-start border border-zinc-200/90 bg-white/85 px-5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:flex dark:border-zinc-800/90 dark:bg-zinc-950/85 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
        metrics.borderRadiusClass,
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium text-zinc-600 transition duration-200 lg:flex dark:text-zinc-400',
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-1.5 text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-800/90"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible = false }: MobileNavProps) => {
  const metrics = getNavbarPillMetrics(visible);
  return (
    <motion.div
      animate={{
        backdropFilter: metrics.backdropFilter,
        width: metrics.mobileWidth,
        y: metrics.translateY,
      }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 34,
      }}
      className={cn(
        'relative z-50 mx-auto flex w-full max-w-2xl flex-col items-center justify-between border border-zinc-200/90 bg-white/85 px-4 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden dark:border-zinc-800/90 dark:bg-zinc-950/85 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
        metrics.borderRadiusClass,
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
  return (
    <div className={cn('flex w-full flex-row items-center justify-between', className)}>
      {children}
    </div>
  );
};

export const MobileNavMenu = ({ children, className, isOpen, onClose }: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl border border-zinc-200 bg-white/95 px-5 py-6 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95',
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isOpen}
      className="rounded-md p-1 text-black dark:text-white"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
};

export const NavbarLogo = ({
  href = '/',
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <a
      href={href}
      className={cn(
        'relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black dark:text-white',
        className,
      )}
    >
      {children}
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = 'a',
  children,
  className,
  variant = 'primary',
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'gradient';
} & (React.ComponentPropsWithoutRef<'a'> | React.ComponentPropsWithoutRef<'button'>)) => {
  const baseStyles =
    'px-4 py-2 rounded-full bg-white text-zinc-950 text-sm font-semibold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center';

  const variantStyles = {
    primary:
      'border border-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
    secondary: 'bg-transparent shadow-none dark:text-zinc-100',
    dark: 'bg-zinc-950 text-white border border-zinc-800 shadow-sm',
    gradient:
      'bg-teal-400 text-zinc-950 hover:bg-teal-300 shadow-[0_2px_14px_rgba(45,212,191,0.28)]',
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
