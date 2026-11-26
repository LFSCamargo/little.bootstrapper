# Rule: project-architecture

> little.bootstrapper Universal AI Rule (Core) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Architecture Pattern: `modular`
- Folder Organization: `module-based`
- File Naming Convention: `kebab-case`
- Test File Organization: `dedicated-tests`
- Strict Boundaries: `true`
- Path Aliases: `true`
- Barrel Exports: `true`
- Separated UI Packages: `packages/ui-web` and `packages/ui-mobile` (only what this stack uses); CLI UI components live inside the Ink app.
- **Atomic Unit Isolation**: `src/commands/`, `src/modules/`, `src/ui/screens/`, `src/types/`, `src/assets/` with barrel-only cross-module imports.

- Native workspaces use Nx plugins with root Cargo/go.work manifests; preserve selected backend frameworks and generate shared Rust DTOs plus TypeScript contracts for mixed Rust/web projects.

- Initialization requires an empty destination. Preserve existing projects and module exports. Verify generated builds and tests across package managers; do not equate file generation or explicit rejection with runtime support.
