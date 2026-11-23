import { test, expect } from '@playwright/test';

test.describe('Planet Express Landing & Docs Page (Playwright E2E)', () => {
  test('renders Liquid Glassy Landing Page with exact Futurama ASCII art, ShadCN Tabs, Aceternity UI & Dark/Light toggle', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Hero & Exact ASCII Illustrations
    await expect(page.getByRole('heading', { name: /Planet Express/i })).toBeVisible();
    await expect(page.locator('pre').first()).toContainText('SSt');
    await expect(page.locator('pre').first()).toContainText("(,;')");
    await expect(page.getByText('Silver Saks')).toBeVisible();
    await expect(page.getByText('Bite my shiny metal scaffold!')).toBeVisible();

    // Separated UI Packages & 5 Universal AI Agents
    await expect(page.locator('span', { hasText: /^packages\/ui-cli$/ })).toBeVisible();
    await expect(page.locator('span', { hasText: /^packages\/ui-web$/ })).toBeVisible();
    await expect(page.locator('span', { hasText: /^packages\/ui-mobile$/ })).toBeVisible();
    for (const agent of ['Open Code', 'Antigravity', 'Claude', 'Codex', 'Cursor']) {
      await expect(page.getByText(agent, { exact: true })).toBeVisible();
    }

    // Interactive ShadCN Tabs for all 3 CLI workflows
    await page.getByTestId('tab-normalize').click();
    await expect(page.getByRole('heading', { name: 'Normalize Existing Setup' })).toBeVisible();
    await expect(page.getByText('little-bootstrapper normalize', { exact: true })).toBeVisible();

    await page.getByTestId('tab-update').click();
    await expect(
      page.getByRole('heading', { name: 'Update Helper (Audited & Pinned)' }),
    ).toBeVisible();
    await expect(page.getByText('CVE-2025-66478').first()).toBeVisible();

    await page.getByTestId('tab-init').click();
    await expect(page.getByRole('heading', { name: 'CORE: Initialize Setup' })).toBeVisible();

    // Dark / Light mode toggle
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await page.getByTestId('theme-toggle').click();
    await expect(html).not.toHaveClass(/dark/);
    await page.getByTestId('theme-toggle').click();
    await expect(html).toHaveClass(/dark/);

    expect(pageErrors).toEqual([]);
  });

  test('navigates to /docs and interacts with ShadCN Architecture Accordion', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.getByRole('link', { name: 'Docs', exact: true }).click();
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
});
