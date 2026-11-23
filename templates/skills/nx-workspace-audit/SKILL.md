---
name: nx-workspace-audit
description: Audit NX monorepo workspace boundaries, project.json targets, and cross-package imports
---

# NX Workspace Audit Skill

1. Scan `apps/` and `packages/` for relative imports crossing package boundaries (`../../packages/`). Replace with package specifiers (`@scope/pkg`).
2. Verify every workspace contains `project.json` with `build`, `test`, and `typecheck` targets.
3. Verify internal workspace links use `workspace:*` and external dependencies are strictly pinned.
4. Confirm UI packages remain separated by platform (`packages/ui-cli`, `packages/ui-web`, `packages/ui-mobile`).
