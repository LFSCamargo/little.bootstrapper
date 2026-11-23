# Changelog — `@little-bootstrapper/initializer`

All notable changes to the Planet Express CLI package are tracked here.

## [Unreleased]

### Changed

- Switched default Yarn project scaffolding from Yarn v6 RC (`6.0.0-rc.23`) to stable **Yarn v4 (`4.19.0`)**.

### Added

- User-configurable test coverage gate (`enabled` toggle + `0–100%` threshold, default `75%`) across interactive `init` wizard, `--no-coverage` / `--coverage-threshold <n>` CLI flags, Zod schemas, `bootstrap.config.json`, and generated `vitest.config.ts` / `jest.config.ts`.
- Interactive navigation & UX polish: persistent `StatusFooter` key-hint bar on every step, `Esc` back-and-forth step history across all wizards and menus, clean auto-exit after workflow execution, plus Unicode `SummaryTable`, `FolderPreview`, and `MarkdownPanel` summaries for form responses, plugins, rules, and verified MCPs.

## [1.0.0] - 2026-11-23

### Added

- `init` — Interactive React Ink (`@inkjs/ui`) & `--yes` headless wizard for polyglot repos (TypeScript, Go, Rust, Solidity), architecture selector + live folder preview, separated `ui-cli` / `ui-web` / `ui-mobile` packages, and context-selective AI rules.
- `rules` — Searchable Rules Marketplace (`28` framework, language, core, and financial rules).
- `mcps` — Searchable Verified Safe MCP Marketplace (`26` audited MCPs) with `--recommend` stack matching and `mcp.json` generation.
- `normalize` — Existing repository scanner & agent-guided sync for AI agents, rules, skills, MCPs, and security configs.
- `update` — Audited & pinned dependency checker with CVE advisory detection (`CVE-2025-66478`, etc.).
- `validate` — 8-check PR pattern validation gate catching unpinned deps, unverified MCPs, leaked secrets, doc sprawl, wrong test placement, cross-package imports, and Ink/Next.js anti-patterns.
- `generate <module>` — Convention-aware module generator obeying `bootstrap.config.json`.
- Zod `4.6.7` validation across all CLI arguments, interactive inputs, and `bootstrap.config.json`.
