# Rule: playwright-testing-rules

> Playwright headless browser E2E testing rules.

- **Place E2E tests exclusively in root `tests/e2e/`**: Keep unit/integration tests near source in `src/**/__tests__/`.
- **Use resilient user-facing locators**: Prefer `getByRole`, `getByLabel`, and `getByTestId`; never rely on brittle CSS class chains or XPath.
- **Zero arbitrary sleeps**: Never use `page.waitForTimeout()`; rely on Playwright web-first assertions (`expect(locator).toBeVisible()`).
- **Assert zero runtime errors**: Capture `page.on('pageerror', ...)` in every E2E spec and assert `pageErrors` is empty.
- **Deterministic local `webServer`**: Boot the built production app via `playwright.config.ts` `webServer` so E2E tests verify real compiled output.
