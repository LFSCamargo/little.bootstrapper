import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  PLANET_EXPRESS_SHIP_ASCII,
  BENDER_MASCOT_ASCII,
  AsciiFrame,
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
  BackgroundBeams,
  CardSpotlight,
  HoverBorderGradient,
  BentoGrid,
  BentoGridItem,
  TextGenerateEffect,
  TracingBeam,
} from '../index';

describe('@little-bootstrapper/ui-web (unit)', () => {
  it('exports the exact Planet Express Ship ASCII art (SSt)', () => {
    expect(PLANET_EXPRESS_SHIP_ASCII).toContain('SSt');
    expect(PLANET_EXPRESS_SHIP_ASCII).toContain("(,;')");
    expect(PLANET_EXPRESS_SHIP_ASCII.split('\n')).toHaveLength(14);
  });

  it('exports the exact Bender Mascot ASCII art (Silver Saks)', () => {
    expect(BENDER_MASCOT_ASCII).toContain('Silver Saks');
    expect(BENDER_MASCOT_ASCII).toContain('@   @');
    expect(BENDER_MASCOT_ASCII.split('\n')).toHaveLength(18);
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
        React.createElement(BackgroundBeams, { className: 'opacity-50' }),
        React.createElement(CardSpotlight, null, 'Spotlight body'),
        React.createElement(HoverBorderGradient, null, 'Run CLI'),
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
        React.createElement(TracingBeam, null, 'Beam docs'),
        React.createElement(AsciiFrame, {
          title: 'SHIP.ASCII',
          subtitle: 'SSt',
          caption: 'Delivery ready',
          art: PLANET_EXPRESS_SHIP_ASCII,
          accent: 'teal',
        }),
        React.createElement(AsciiFrame, {
          title: 'BENDER.ASCII',
          art: BENDER_MASCOT_ASCII,
          accent: 'lime',
        }),
      ),
    );
    expect(html).toContain('Spotlight body');
    expect(html).toContain('Run CLI');
    expect(html).toContain('UI CLI');
    expect(html).toContain('Good');
    expect(html).toContain('Beam docs');
    expect(html).toContain('SHIP.ASCII');
    expect(html).toContain('BENDER.ASCII');
  });
});
