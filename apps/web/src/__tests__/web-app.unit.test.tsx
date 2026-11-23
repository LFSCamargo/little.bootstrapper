import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import HomePage from '../app/page';
import DocsPage from '../app/docs/page';
import NotFound from '../app/not-found';
import RootLayout, { metadata } from '../app/layout';
import { Navbar, NAV_ITEMS } from '../components/navbar';
import { CopyCommandPill } from '../components/landing/copy-command-pill';
import { HERO_AGENTS } from '../components/landing/hero';
import { AGENTS, CREW_QUOTES } from '../components/landing/sections';

describe('@little-bootstrapper/web (unit)', () => {
  it('renders the landing page with Aceternity hero, image-based ASCII frames, glowing grid, timeline, and CTA', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('little.bootstrapper');
    expect(html).toContain('Less setup.');
    expect(html).not.toContain('Planet Express');
    expect(html).toContain('FUTURAMA_SHIP.ASCII');
    expect(html).toContain('/images/planet-express-ship.jpg');
    expect(html).toContain('BENDER_MASCOT.ASCII');
    expect(html).toContain('/images/bender.png');
    expect(html).toContain('packages/ui-cli');
    expect(html).toContain('packages/ui-web');
    expect(html).toContain('packages/ui-mobile');
    expect(html).toContain('CORE: Initialize Setup');
    expect(html).toContain('Normalize Existing Setup');
    expect(html).toContain('Update Helper (Audited &amp; Pinned)');
    expect(html).toContain('without the setup spiral.');
    for (const agent of AGENTS) {
      expect(html).toContain(agent.name);
    }
    expect(HERO_AGENTS).toHaveLength(5);
    expect(CREW_QUOTES.map((item) => item.name)).toEqual(['A nod to Fry', 'A nod to Bender']);
  });

  it('renders the documentation page with Aceternity hero, sticky navigation, GlowingEffect blueprint, and accordion', () => {
    const html = renderToStaticMarkup(<DocsPage />);
    expect(html).toContain('Documentation');
    expect(html).toContain('little.bootstrapper documentation');
    expect(html).toContain('Documentation sections');
    expect(html).toContain('id="architecture-patterns"');
    expect(html).toContain('data-testid="docs-content"');
    expect(html).toContain('little-bootstrapper init');
    expect(html).toContain('little-bootstrapper mcps');
    expect(html).toContain('scripts/pipeline.sh');
    expect(html).toContain('packages/contracts');
    expect(html).toContain('Atomic Modular Unit Architecture');
    expect(html).toContain('Architecture Patterns');
  });

  it('renders the 404 NotFound page with Bender ASCII filter frame and home CTA', () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('404');
    expect(html).toContain('Wrong Dimension');
    expect(html).toContain('BENDER_LOST.ASCII');
    expect(html).toContain('/images/bender.png');
    expect(html).toContain('Back to little.bootstrapper');
  });

  it('renders RootLayout, Resizable Navbar, CopyCommandPill, and exports SEO metadata', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(String(metadata.title)).toContain('little.bootstrapper');
    expect(NAV_ITEMS.map((item) => item.name)).toEqual(['Features', 'Workflows', 'Agents', 'Docs']);

    const navHtml = renderToStaticMarkup(<Navbar />);
    expect(navHtml).toContain('<nav');
    expect(navHtml).toContain('Primary navigation');
    expect(navHtml).toContain('fixed inset-x-0 top-4');
    expect(navHtml).toContain('/images/logo.png');
    expect(navHtml).toContain('little');
    expect(navHtml).toContain('Features');
    expect(navHtml).toContain('Docs');
    expect(navHtml).toContain('theme-toggle');
    expect(navHtml).toContain('Get Started');

    const pillHtml = renderToStaticMarkup(
      <CopyCommandPill command="npx little-bootstrapper init" />,
    );
    expect(pillHtml).toContain('npx little-bootstrapper init');
    expect(pillHtml).toContain('copy-cli-command');

    const layoutHtml = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="child">Content</div>
      </RootLayout>,
    );
    expect(layoutHtml).toContain('liquid-glass-bg');
    expect(layoutHtml).toContain('Content');
    expect(layoutHtml).toContain(
      `© ${new Date().getFullYear()} little.bootstrapper. All rights reserved.`,
    );
    expect(layoutHtml).not.toContain('Powered by');
    expect(layoutHtml).toContain('Footer resources');
  });

  it('reflects Aceternity Pro disabled state on HomePage and DocsPage when flag is false', () => {
    const prevEnabled = process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED;
    try {
      process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED = 'false';

      const homeHtml = renderToStaticMarkup(<HomePage />);
      expect(homeHtml).toContain('Disabled');

      const docsHtml = renderToStaticMarkup(<DocsPage />);
      expect(docsHtml).toContain('Pro Registry: Disabled');
    } finally {
      if (prevEnabled === undefined) delete process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED;
      else process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED = prevEnabled;
    }
  });
});
