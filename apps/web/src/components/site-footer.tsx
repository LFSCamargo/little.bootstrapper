import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const FOOTER_GROUPS = [
  {
    title: 'Explore',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'CLI workflows', href: '/#workflows' },
      { label: 'AI agents', href: '/#agents' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'CLI commands', href: '/docs#cli-commands' },
      { label: 'Architecture patterns', href: '/docs#architecture-patterns' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-14">
        <div className="grid gap-10 pb-12 sm:grid-cols-[2fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 font-bold tracking-tight">
              <img src="/images/logo.png" alt="little.bootstrapper logo" width={44} height={44} />
              <span>
                little<span className="text-teal-600 dark:text-teal-400">.bootstrapper</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              One canonical brain for your entire crew. Build a clean monorepo and deliver your next
              idea.
            </p>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
            >
              Start building <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <nav aria-label="Footer resources" className="grid grid-cols-2 gap-8 sm:col-span-2">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {group.title}
                </h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-700 transition-colors hover:text-teal-600 dark:text-zinc-300 dark:hover:text-teal-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-zinc-200/80 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} little.bootstrapper. All rights reserved.</p>
          <p className="font-mono">Five agents. One shared direction.</p>
        </div>
      </div>
    </footer>
  );
}
