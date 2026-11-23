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
import { Navbar } from '../components/navbar';
import { CliWorkflowsTabs } from '../components/cli-workflows-tabs';

describe('@little-bootstrapper/web (unit)', () => {
  it('renders the landing page with Planet Express branding, ASCII art, and workflows', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('Planet Express');
    expect(html).toContain('AI Initializer');
    expect(html).toContain('PLANET_EXPRESS_SHIP.ASCII');
    expect(html).toContain('BENDER_MASCOT.ASCII');
    expect(html).toContain('SSt');
    expect(html).toContain('Silver Saks');
    expect(html).toContain('packages/ui-cli');
    expect(html).toContain('packages/ui-web');
    expect(html).toContain('packages/ui-mobile');
  });

  it('renders the documentation page with CLI commands, architecture blueprint, and accordion', () => {
    const html = renderToStaticMarkup(<DocsPage />);
    expect(html).toContain('Documentation');
    expect(html).toContain('Planet Express Operations Manual');
    expect(html).toContain('little-bootstrapper init');
    expect(html).toContain('little-bootstrapper mcps');
    expect(html).toContain('Atomic Modular Unit Architecture');
    expect(html).toContain('Architecture Patterns');
  });

  it('renders the 404 NotFound page with Futurama copy and home link', () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('404');
    expect(html).toContain('Wrong Dimension');
    expect(html).toContain('Return to Planet Express HQ');
  });

  it('renders RootLayout, Navbar, CliWorkflowsTabs, and exports SEO metadata', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(String(metadata.title)).toContain('little.bootstrapper');

    const navHtml = renderToStaticMarkup(<Navbar />);
    expect(navHtml).toContain('little');
    expect(navHtml).toContain('Home');
    expect(navHtml).toContain('Docs');
    expect(navHtml).toContain('theme-toggle');

    const tabsHtml = renderToStaticMarkup(<CliWorkflowsTabs />);
    expect(tabsHtml).toContain('Initialize Setup');
    expect(tabsHtml).toContain('Normalize Setup');
    expect(tabsHtml).toContain('Update Helper');

    const layoutHtml = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="child">Content</div>
      </RootLayout>,
    );
    expect(layoutHtml).toContain('liquid-glass-bg');
    expect(layoutHtml).toContain('Content');
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
