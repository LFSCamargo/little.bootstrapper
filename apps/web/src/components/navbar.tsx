'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, Rocket, BookOpen, Terminal } from 'lucide-react';
import { Button } from '@little-bootstrapper/ui-web';

export function Navbar() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-6xl px-4">
      <nav className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/70 px-5 py-3 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-lime-400 text-slate-950 shadow-md">
            <Rocket className="h-5 w-5" />
          </span>
          <span className="text-base sm:text-lg">
            little<span className="text-teal-600 dark:text-teal-400">.bootstrapper</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Terminal className="h-4 w-4 text-teal-500" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">
              <BookOpen className="h-4 w-4 text-lime-500" />
              Docs
            </Link>
          </Button>
          <Button
            type="button"
            variant="glass"
            size="icon"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark or light mode"
            data-testid="theme-toggle"
          >
            {dark ? (
              <Sun className="h-4 w-4 text-teal-300" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>
        </div>
      </nav>
    </header>
  );
}
