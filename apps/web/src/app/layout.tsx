import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'little.bootstrapper — Planet Express Universal AI Agent Initializer & Rules Marketplace',
  description:
    'Good news, everyone! Bootstrap polyglot NX monorepos with universal rules, skills, verified safe MCPs, and clean architecture across Open Code, Antigravity, Claude, Codex, and Cursor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="liquid-glass-bg min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10">{children}</main>
      </body>
    </html>
  );
}
