# Rule: nx-monorepo-rules

> Planet Express Universal AI Rule (Framework) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Never use cross-package relative imports (`../../packages/...`); import by scoped package name.
- Declare `project.json` targets (`build`, `test`, `typecheck`) and keep UI packages separated by platform.
- Use `workspace:*` for internal links and exact pinned versions for external deps.
