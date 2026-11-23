# Rule: quality-gating

> Planet Express Universal AI Rule (Core) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Every change MUST pass typecheck, lint, unit tests, integration tests, E2E tests, and build before completion.
- All dependencies MUST use exact pinned, audited versions (no `^` or `~`).
- Never suppress compiler or linter errors without a documented justification.
