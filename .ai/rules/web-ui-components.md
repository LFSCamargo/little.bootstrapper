# Rule: web-ui-components

> little.bootstrapper Universal AI Rule (Framework) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- All reusable Web UI components (ShadCN, Aceternity UI, shared primitives) MUST live inside `packages/ui-web`.
- Web apps in `apps/*` import from `packages/ui-web` and never duplicate shared primitives locally.
