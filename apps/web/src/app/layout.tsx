import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { SiteFooter } from '@/components/site-footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'little.bootstrapper — Less setup. More building.',
  description:
    'A library and CLI for starting polyglot monorepos with shared AI rules, architecture previews, and pinned dependencies. Works with Open Code, Antigravity, Claude, Codex, and Cursor.',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="liquid-glass-bg">
        <Navbar />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
