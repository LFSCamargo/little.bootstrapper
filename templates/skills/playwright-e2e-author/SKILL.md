---
name: playwright-e2e-author
description: Author flake-free Playwright E2E specs in tests/e2e/ using accessible locators and zero-error assertions
---

# Playwright E2E Author Skill

1. Place all browser E2E specs under `<app>/tests/e2e/*.e2e.spec.ts`.
2. Attach `page.on('pageerror', ...)` and assert zero uncaught runtime errors.
3. Use accessible locators (`getByRole`, `getByLabel`, `getByTestId`) with strict web-first assertions — zero `waitForTimeout()`.
4. Run against the compiled production build via `playwright.config.ts` `webServer`.
