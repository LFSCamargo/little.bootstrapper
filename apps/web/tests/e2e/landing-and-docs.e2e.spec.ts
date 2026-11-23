import { test, expect } from '@playwright/test';

test.describe('little.bootstrapper Landing & Docs Page (Playwright E2E)', () => {
  test('uses the nvim.setup font pairing, headline tracking, and library copyright', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1 });
    const typography = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        family: style.fontFamily,
        tracking: parseFloat(style.letterSpacing) / parseFloat(style.fontSize),
      };
    });
    expect(typography.family).toContain('DM Sans');
    expect(typography.tracking).toBeCloseTo(-0.06);
    const accent = heading.getByText('More building.');
    expect(await accent.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
      'DM Serif Display',
    );
    expect(
      await page
        .getByText('npx little-bootstrapper init', { exact: true })
        .evaluate((element) => getComputedStyle(element).fontFamily),
    ).toContain('IBM Plex Mono');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText(
      `© ${new Date().getFullYear()} little.bootstrapper. All rights reserved.`,
    );
    await expect(page.locator('body')).not.toContainText('Planet Express');
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1024, 1584]) {
    test(`keeps the floating navbar clear of the hero at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
      await expect(navigation).toBeVisible();
      const nav = await navigation.boundingBox();
      const hero = await page.getByTestId('hero').boundingBox();
      const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
      if (!nav || !hero || !heading) throw new Error('Missing navigation or hero');
      expect(nav.y).toBeGreaterThanOrEqual(16);
      // The hero background must extend behind the floating navbar without a blank band.
      expect(hero.y).toBe(0);
      expect(heading.y - (nav.y + nav.height)).toBeGreaterThanOrEqual(48);
      expect(await navigation.evaluate((element) => getComputedStyle(element).position)).toBe(
        'fixed',
      );
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
      await expect(navigation).toBeInViewport();
      expect(errors).toEqual([]);
    });
  }

  for (const width of [390, 1584]) {
    test(`docs spacing and sticky navigation at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/docs');
      const navigation = page.getByRole('navigation', { name: 'Documentation sections' });
      await expect(navigation).toBeVisible();
      const sections = page.getByTestId('docs-content');
      const gaps = await sections.evaluate((element) => {
        const children = Array.from(element.children);
        return children
          .slice(1)
          .map(
            (child, index) =>
              child.getBoundingClientRect().top - children[index].getBoundingClientRect().bottom,
          );
      });
      for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(24);
      await navigation.getByRole('link', { name: 'Architecture patterns', exact: true }).click();
      await expect(page).toHaveURL(/#architecture-patterns$/);
      await expect(navigation).toBeInViewport();
      await expect(
        page.getByRole('button', { name: 'Modular Architecture (Default)' }),
      ).toBeInViewport();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      const footer = page.getByRole('contentinfo');
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.getByRole('navigation', { name: 'Footer resources' })).toBeVisible();
      await expect(
        footer.getByRole('link', { name: 'Documentation', exact: true }),
      ).toHaveAttribute('href', '/docs');
      expect(errors).toEqual([]);
    });
  }

  test('renders Aceternity landing page with image-based ASCII art filter, glowing features, timeline, and Dark/Light toggle', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Hero section with Aceternity Spotlight, FlipWords, MovingBorder CTA, and CopyCommandPill
    await expect(page.getByRole('heading', { name: /Less setup/i })).toBeVisible();
    await expect(page.getByTestId('copy-cli-command')).toBeVisible();
    await page.getByTestId('copy-cli-command').click();

    // Image-based Aceternity AsciiArt renders both attached images onto <canvas>
    const shipAscii = page.locator(
      '[data-testid="ascii-art"][data-src="/images/planet-express-ship.jpg"]',
    );
    await expect(shipAscii).toHaveAttribute('data-loaded', 'true');
    const shipCanvas = shipAscii.getByRole('img', { name: /Futurama delivery ship/i });
    await expect(shipCanvas).toBeVisible();

    const shipHasPixels = await shipCanvas.evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx || canvas.width === 0 || canvas.height === 0) return false;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let nonBackground = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 30 || data[i + 1] > 30 || data[i + 2] > 30) nonBackground++;
      }
      return nonBackground > 500;
    });
    expect(shipHasPixels).toBe(true);

    // Interactive Aceternity ASCII filter preset switching (Blocks + Mono)
    const shipControls = page.getByRole('group', {
      name: /ASCII filter controls for FUTURAMA_SHIP\.ASCII/i,
    });
    const blocksBtn = shipControls.getByRole('button', { name: 'Blocks' });
    await blocksBtn.click();
    await expect(blocksBtn).toHaveAttribute('aria-pressed', 'true');
    const colorToggle = shipControls.getByRole('button', { name: 'Color' });
    await colorToggle.click();
    await expect(shipControls.getByRole('button', { name: 'Mono' })).toBeVisible();

    // Bender image-based Aceternity AsciiArt
    const benderAscii = page.locator('[data-testid="ascii-art"][data-src="/images/bender.png"]');
    await benderAscii.scrollIntoViewIfNeeded();
    await expect(benderAscii).toHaveAttribute('data-loaded', 'true');
    await expect(benderAscii.getByRole('img', { name: /Bender/i })).toBeVisible();
    await expect(page.getByText('Bite my shiny metal scaffold!')).toBeVisible();

    // Separated UI Packages & 5 Universal AI Agents
    await expect(page.getByText('packages/ui-cli', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('packages/ui-web', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('packages/ui-mobile', { exact: true }).first()).toBeVisible();
    for (const agent of ['Open Code', 'Antigravity', 'Claude', 'Codex', 'Cursor']) {
      await expect(page.locator('#agents').getByText(agent, { exact: true })).toBeVisible();
    }

    // Aceternity Timeline workflows (all 3 missions)
    await expect(page.getByRole('heading', { name: 'CORE: Initialize Setup' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Normalize Existing Setup' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Update Helper (Audited & Pinned)' }),
    ).toBeVisible();

    // Aceternity InfiniteMovingCards crew quotes & Final CTA
    await expect(page.getByTestId('crew-quotes')).toBeVisible();
    await expect(page.getByRole('heading', { name: /without the setup spiral/i })).toBeVisible();

    // Dark / Light mode toggle
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await page.getByTestId('theme-toggle').click();
    await expect(html).not.toHaveClass(/dark/);
    await page.getByTestId('theme-toggle').click();
    await expect(html).toHaveClass(/dark/);

    expect(pageErrors).toEqual([]);
  });

  test('renders cleanly on mobile without horizontal overflow', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Less setup/i })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('link', { name: 'Get Started' }).last()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('navigates to /docs and interacts with ShadCN Architecture Accordion', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.getByRole('link', { name: 'Docs', exact: true }).first().click();
    await expect(page).toHaveURL(/\/docs$/);

    await expect(page.getByRole('heading', { name: 'Documentation' })).toBeVisible();
    await expect(page.getByText('little-bootstrapper init')).toBeVisible();
    await expect(page.getByText('little-bootstrapper normalize')).toBeVisible();
    await expect(page.getByText('little-bootstrapper update [--apply]')).toBeVisible();
    await expect(page.getByText('ACETERNITY_PRO_API_KEY')).toBeVisible();

    // Expand Hexagonal Architecture Accordion item (Radix + ShadCN)
    await page.getByRole('button', { name: /Ports & Adapters \(Hexagonal\)/i }).click();
    await expect(page.getByText('src/domain/')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('renders 404 page with Bender Aceternity AsciiArt filter', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/wrong-dimension-route');
    await expect(page.getByRole('heading', { name: /404 — Wrong Dimension!/i })).toBeVisible();

    const benderAscii = page.locator('[data-testid="ascii-art"][data-src="/images/bender.png"]');
    await expect(benderAscii).toHaveAttribute('data-loaded', 'true');
    await expect(page.getByRole('link', { name: 'Back to little.bootstrapper' })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
