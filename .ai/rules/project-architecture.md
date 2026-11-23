# Rule: project-architecture

> little.bootstrapper Universal AI Rule (Core) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Architecture Pattern: `modular`
- Folder Organization: `module-based`
- File Naming Convention: `kebab-case`
- Test File Organization: `dedicated-tests`
- Strict Boundaries: `true`
- Path Aliases: `true`
- Barrel Exports: `true`
- Separated UI Packages: `packages/ui-cli`, `packages/ui-web`, `packages/ui-mobile` (only what this stack uses)
- **Atomic Unit Isolation**: `src/commands/`, `src/modules/`, `src/ui/screens/`, `src/types/`, `src/assets/` with barrel-only cross-module imports.
