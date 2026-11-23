# Rule: playwright-testing-rules

> Planet Express Universal AI Rule (Framework) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Place E2E tests exclusively in root `tests/e2e/` and prefer `getByRole`/`getByTestId` over CSS selectors.
- Never use `waitForTimeout()`; capture `page.on('pageerror')` and assert zero uncaught errors.
