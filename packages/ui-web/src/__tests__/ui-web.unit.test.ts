import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  PLANET_EXPRESS_SHIP_IMAGE,
  BENDER_MASCOT_IMAGE,
  AsciiFrame,
  AsciiArt,
  AsciiArtStatic,
  ASCII_CHARSETS,
  cn,
  Button,
  buttonVariants,
  Badge,
  badgeVariants,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  getAceternityProStatus,
  Spotlight,
  SpotlightNew,
  BackgroundBeams,
  BackgroundBeamsWithCollision,
  CardSpotlight,
  HoverBorderGradient,
  MovingBorderButton,
  BentoGrid,
  BentoGridItem,
  GlowingEffect,
  TextGenerateEffect,
  FlipWords,
  HeroHighlight,
  Highlight,
  TracingBeam,
  Timeline,
  InfiniteMovingCards,
  ShootingStars,
  createRandomTrajectory,
  StarsBackground,
  generateStarsField,
  ResizableNavbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  getNavbarPillMetrics,
} from '../index';

describe('@little-bootstrapper/ui-web (unit)', () => {
  it('exports the Futurama delivery ship and Bender image sources for the Aceternity ASCII filter', () => {
    expect(PLANET_EXPRESS_SHIP_IMAGE.src).toBe('/images/planet-express-ship.jpg');
    expect(PLANET_EXPRESS_SHIP_IMAGE.alt).toContain('Futurama delivery ship');
    expect(BENDER_MASCOT_IMAGE.src).toBe('/images/bender.png');
    expect(BENDER_MASCOT_IMAGE.alt).toContain('Bender');
    expect(ASCII_CHARSETS.standard).toContain('@');
    expect(ASCII_CHARSETS.blocks).toContain('█');
    expect(ASCII_CHARSETS.braille).toContain('⣿');
  });

  it('provides ShadCN utilities, variants, and renders all ShadCN primitives', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(buttonVariants({ variant: 'glass', size: 'lg' })).toContain('backdrop-blur-xl');
    expect(badgeVariants({ variant: 'lime' })).toContain('lime');

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(Button, { variant: 'default', size: 'sm' }, 'Launch'),
        React.createElement(
          Button,
          { asChild: true, variant: 'outline' },
          React.createElement('a', { href: '/docs' }, 'Docs'),
        ),
        React.createElement(Badge, { variant: 'steel' }, 'Pinned'),
        React.createElement(
          Card,
          null,
          React.createElement(
            CardHeader,
            null,
            React.createElement(CardTitle, null, 'Ship Status'),
            React.createElement(CardDescription, null, 'All systems nominal'),
          ),
          React.createElement(CardContent, null, 'Dark matter fueled'),
          React.createElement(CardFooter, null, 'Ready'),
        ),
        React.createElement(Separator, { orientation: 'horizontal' }),
        React.createElement(Separator, { orientation: 'vertical' }),
        React.createElement(
          Tabs,
          { defaultValue: 'one' },
          React.createElement(
            TabsList,
            null,
            React.createElement(TabsTrigger, { value: 'one' }, 'One'),
          ),
          React.createElement(TabsContent, { value: 'one' }, 'Tab One'),
        ),
        React.createElement(
          Accordion,
          { type: 'single', collapsible: true, defaultValue: 'item-1' },
          React.createElement(
            AccordionItem,
            { value: 'item-1' },
            React.createElement(AccordionTrigger, null, 'Modular'),
            React.createElement(AccordionContent, null, 'Clean boundaries'),
          ),
        ),
      ),
    );
    expect(html).toContain('Launch');
    expect(html).toContain('Docs');
    expect(html).toContain('Ship Status');
    expect(html).toContain('Tab One');
    expect(html).toContain('Modular');
  });

  it('renders Aceternity UI & Futurama components and resolves Aceternity Pro env status', () => {
    const prevApi = process.env.ACETERNITY_PRO_API_KEY;
    const prevLic = process.env.ACETERNITY_PRO_LICENSE_KEY;
    const prevEnabled = process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED;
    try {
      delete process.env.ACETERNITY_PRO_API_KEY;
      delete process.env.ACETERNITY_PRO_LICENSE_KEY;
      process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED = 'false';
      const disabledStatus = getAceternityProStatus();
      expect(disabledStatus.registryUrl).toBe('https://pro.aceternity.com/registry');
      expect(disabledStatus.enabled).toBe(false);
      expect(disabledStatus.hasApiKey).toBe(false);
      expect(disabledStatus.hasLicenseKey).toBe(false);

      process.env.ACETERNITY_PRO_API_KEY = 'secret-pro-key';
      process.env.ACETERNITY_PRO_LICENSE_KEY = 'lic-123';
      process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED = 'true';
      const enabledStatus = getAceternityProStatus();
      expect(enabledStatus.enabled).toBe(true);
      expect(enabledStatus.hasApiKey).toBe(true);
      expect(enabledStatus.hasLicenseKey).toBe(true);
    } finally {
      if (prevApi === undefined) delete process.env.ACETERNITY_PRO_API_KEY;
      else process.env.ACETERNITY_PRO_API_KEY = prevApi;
      if (prevLic === undefined) delete process.env.ACETERNITY_PRO_LICENSE_KEY;
      else process.env.ACETERNITY_PRO_LICENSE_KEY = prevLic;
      if (prevEnabled === undefined) delete process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED;
      else process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED = prevEnabled;
    }

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(Spotlight, { fill: '#2dd4bf' }),
        React.createElement(SpotlightNew),
        React.createElement(BackgroundBeams, { className: 'opacity-50' }),
        React.createElement(BackgroundBeamsWithCollision, null, 'Collision CTA'),
        React.createElement(CardSpotlight, null, 'Spotlight body'),
        React.createElement(HoverBorderGradient, null, 'Run CLI'),
        React.createElement(MovingBorderButton, {
          as: 'a',
          href: '/docs',
          children: 'Moving CTA',
        }),
        React.createElement(GlowingEffect, { glow: true, disabled: false }),
        React.createElement(GlowingEffect, {
          glow: false,
          disabled: true,
          variant: 'white',
          blur: 4,
        }),
        React.createElement(
          BentoGrid,
          null,
          React.createElement(BentoGridItem, {
            title: 'UI CLI',
            description: 'Ink components',
            header: React.createElement('div', null, 'Header'),
            icon: React.createElement('span', null, '*'),
          }),
        ),
        React.createElement(TextGenerateEffect, { words: 'Good news everyone' }),
        React.createElement(FlipWords, { words: ['Claude', 'Cursor'] }),
        React.createElement(
          HeroHighlight,
          null,
          React.createElement(Highlight, null, 'Highlighted'),
        ),
        React.createElement(TracingBeam, null, 'Beam docs'),
        React.createElement(Timeline, {
          badge: React.createElement('span', null, 'Mission'),
          title: 'Workflows',
          description: 'Three steps',
          data: [{ title: 'Init', content: React.createElement('div', null, 'Step 1') }],
        }),
        React.createElement(Timeline, {
          data: [{ title: 'Minimal', content: React.createElement('div', null, 'Body') }],
        }),
        React.createElement(InfiniteMovingCards, {
          items: [{ quote: 'Good news', name: 'Farnsworth', title: 'Professor' }],
          direction: 'right',
          speed: 'normal',
          pauseOnHover: false,
        }),
        React.createElement(ShootingStars),
        React.createElement(StarsBackground),
        React.createElement(
          ResizableNavbar,
          null,
          React.createElement(NavBody, {
            visible: false,
            children: React.createElement(
              React.Fragment,
              null,
              React.createElement(NavbarLogo, { href: '/', children: 'LogoTop' }),
              React.createElement(NavItems, { items: [{ name: 'Docs', link: '/docs' }] }),
              React.createElement(NavbarButton, {
                href: '/docs',
                variant: 'primary',
                children: 'TopStart',
              }),
            ),
          }),
          React.createElement(NavBody, {
            visible: true,
            children: React.createElement(
              React.Fragment,
              null,
              React.createElement(NavbarLogo, { href: '/', children: 'Logo' }),
              React.createElement(NavItems, { items: [{ name: 'Docs', link: '/docs' }] }),
              React.createElement(NavbarButton, {
                href: '/docs',
                variant: 'gradient',
                children: 'Start',
              }),
            ),
          }),
          React.createElement(MobileNav, {
            visible: false,
            children: React.createElement(
              React.Fragment,
              null,
              React.createElement(MobileNavHeader, {
                children: React.createElement(MobileNavToggle, {
                  isOpen: false,
                  onClick: () => undefined,
                }),
              }),
              React.createElement(MobileNavMenu, {
                isOpen: true,
                onClose: () => undefined,
                children: React.createElement('a', { href: '/docs' }, 'Docs'),
              }),
            ),
          }),
          React.createElement(MobileNav, {
            visible: true,
            children: React.createElement(MobileNavHeader, {
              children: React.createElement(MobileNavToggle, {
                isOpen: true,
                onClick: () => undefined,
              }),
            }),
          }),
        ),
        React.createElement(AsciiArt, {
          src: PLANET_EXPRESS_SHIP_IMAGE.src,
          alt: PLANET_EXPRESS_SHIP_IMAGE.alt,
        }),
        React.createElement(AsciiArtStatic, {
          src: BENDER_MASCOT_IMAGE.src,
          alt: BENDER_MASCOT_IMAGE.alt,
          inverted: true,
        }),
        React.createElement(AsciiFrame, {
          title: 'SHIP.ASCII',
          subtitle: 'Aceternity',
          caption: 'Delivery ready',
          src: PLANET_EXPRESS_SHIP_IMAGE.src,
          alt: PLANET_EXPRESS_SHIP_IMAGE.alt,
          accent: 'teal',
        }),
        React.createElement(AsciiFrame, {
          title: 'BENDER.ASCII',
          src: BENDER_MASCOT_IMAGE.src,
          alt: BENDER_MASCOT_IMAGE.alt,
          accent: 'lime',
          colored: false,
          interactive: true,
        }),
      ),
    );
    expect(html).toContain('Collision CTA');
    expect(html).toContain('Spotlight body');
    expect(html).toContain('Run CLI');
    expect(html).toContain('Moving CTA');
    expect(html).toContain('UI CLI');
    expect(html).toContain('Good');
    expect(html).toContain('Highlighted');
    expect(html).toContain('Beam docs');
    expect(html).toContain('Workflows');
    expect(html).toContain('Farnsworth');
    expect(html).toContain('SHIP.ASCII');
    expect(html).toContain('BENDER.ASCII');
    expect(html).toContain('/images/planet-express-ship.jpg');
    expect(html).toContain('/images/bender.png');

    // Verify always-pill navbar invariants at both top (scroll=0) and scrolled states
    expect(getNavbarPillMetrics(false).borderRadiusClass).toBe('rounded-full');
    expect(getNavbarPillMetrics(true).borderRadiusClass).toBe('rounded-full');
    expect(getNavbarPillMetrics(false).backdropFilter).toBe('blur(16px)');
    expect(getNavbarPillMetrics(false).translateY).toBe(0);
    expect(getNavbarPillMetrics(true).translateY).toBe(0);
    expect(getNavbarPillMetrics(true).desktopMaxWidth).toBe('840px');

    const stars = generateStarsField(400, 300, {
      starDensity: 0.0001,
      allStarsTwinkle: true,
      twinkleProbability: 0.7,
      minTwinkleSpeed: 0.5,
      maxTwinkleSpeed: 1,
    });
    expect(stars).toHaveLength(12);
    expect(stars.every((s) => s.twinkleSpeed !== null)).toBe(true);

    const staticStars = generateStarsField(400, 300, {
      starDensity: 0.0001,
      allStarsTwinkle: false,
      twinkleProbability: 0,
      minTwinkleSpeed: 0.5,
      maxTwinkleSpeed: 1,
    });
    expect(staticStars.every((s) => s.twinkleSpeed === null)).toBe(true);

    for (const side of [0, 1, 2, 3] as const) {
      const traj = createRandomTrajectory(10, 20, { width: 1200, height: 800 }, side);
      expect(traj.duration).toBeGreaterThanOrEqual(0.6);
      expect(traj.angle).toBe(45 + side * 90);
    }
  });
});
