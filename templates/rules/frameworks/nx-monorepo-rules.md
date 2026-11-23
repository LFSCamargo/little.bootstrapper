# Rule: nx-monorepo-rules

> NX Monorepo boundaries, workspace linking, and task graph hygiene.

- **Never use cross-package relative imports**: Import sibling packages by package name (`@scope/ui-web`, `@scope/ui-cli`), never `../../packages/...`.
- **Declare `project.json` targets cleanly**: Every app and package must expose `build`, `test`, and `typecheck` targets so `nx run-many` and caching work reliably.
- **Pin workspace & external versions**: Use `workspace:*` for internal monorepo packages and exact pinned versions (no `^`/`~`) for external dependencies.
- **Keep UI packages separated by platform**: `packages/ui-cli` (Ink), `packages/ui-web` (ShadCN/Aceternity), and `packages/ui-mobile` (React Native/Lynx).
- **Avoid circular dependencies**: Domain packages must never import from `apps/*`.
