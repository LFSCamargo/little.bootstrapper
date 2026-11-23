'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  ResizableNavbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from '@little-bootstrapper/ui-web';

export const NAV_ITEMS = [
  { name: 'Features', link: '/#features' },
  { name: 'Workflows', link: '/#workflows' },
  { name: 'Agents', link: '/#agents' },
  { name: 'Docs', link: '/docs' },
];

function Logo() {
  return (
    <NavbarLogo href="/" className="py-0.5">
      <img
        src="/images/logo.png"
        alt="little.bootstrapper logo"
        width={34}
        height={34}
        className="h-12 w-12 shrink-0 object-contain"
      />
      <span className="text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-base">
        little<span className="text-teal-600 dark:text-teal-400">.bootstrapper</span>
      </span>
    </NavbarLogo>
  );
}

function ThemeToggle({
  dark,
  onToggle,
  testId,
}: {
  dark: boolean;
  onToggle: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle dark or light mode"
      data-testid={testId}
      className="relative z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-100/80 transition hover:-translate-y-0.5 hover:border-teal-500/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {dark ? (
        <Sun className="h-4 w-4 text-teal-400" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700" />
      )}
    </button>
  );
}

export function Navbar() {
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Syncs the theme choice to the <html> element (external DOM system).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);

  return (
    <ResizableNavbar>
      <NavBody>
        <Logo />
        <NavItems items={NAV_ITEMS} />
        <div className="relative z-20 flex items-center gap-2.5">
          <ThemeToggle dark={dark} onToggle={toggleTheme} testId="theme-toggle" />
          <NavbarButton
            href="/docs"
            variant="gradient"
            className="rounded-full bg-teal-400 px-4 py-2 text-zinc-950 hover:bg-teal-300"
          >
            Get Started
          </NavbarButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle dark={dark} onToggle={toggleTheme} testId="theme-toggle-mobile" />
            <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen((o) => !o)} />
          </div>
        </MobileNavHeader>
        <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.link}
              onClick={() => setMobileOpen(false)}
              className="w-full rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {item.name}
            </a>
          ))}
          <NavbarButton
            href="/docs"
            variant="gradient"
            className="w-full rounded-full bg-teal-400 text-zinc-950 hover:bg-teal-300"
          >
            Get Started
          </NavbarButton>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}
