# Rule: e2e-testing

> little.bootstrapper Universal AI Rule (Core) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Critical user flows MUST have end-to-end tests in root `tests/e2e/` (Playwright for web, spawned binary for CLI).
- Keep E2E tests deterministic and assert zero uncaught page/runtime errors.
