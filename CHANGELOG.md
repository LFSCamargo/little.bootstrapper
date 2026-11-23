# Changelog

All notable changes to **little.bootstrapper** (Planet Express Universal AI Agent Initializer & Rules Marketplace) are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Switched package manager configuration & project generator templates from Yarn v6 RC (`6.0.0-rc.23`) to stable **Yarn v4 (`4.19.0`)** with a locked `yarn.lock` for reliable cross-platform DNS/dependency resolution.

### Added

- Configurable Test Coverage Gate (`75%` default across CLI & Web): enforced `75%` lines/statements/functions/branches coverage thresholds in `packages/initializer`, `packages/ui-cli`, `packages/ui-web`, and `apps/web` via `@vitest/coverage-v8`, plus user-configurable coverage toggle & threshold (`0–100%`) in `init` wizard, `--no-coverage` / `--coverage-threshold` flags, `bootstrap.config.json`, and generated `vitest.config.ts` / `jest.config.ts`.
- Interactive CLI Navigation & UX polish: persistent `StatusFooter` key-hint statusline on every step, `Esc` back-and-forth step history across wizards & menus, clean auto-exit after workflow execution, plus Unicode `SummaryTable`, `FolderPreview`, and `MarkdownPanel` reports for form responses, plugins, rules, and verified MCPs.
- PR Pattern Validation Gate (`little-bootstrapper validate` + `.github/workflows/pr-validation.yml`) enforcing pinned audited deps, universal AI rules, MCP security, NX boundaries, test pyramid placement, anti-doc-sprawl, Ink/Next.js anti-patterns, OpenGrep, GitLeaks, and full unit/integration/E2E tests.
- Automated Tag Release Pipeline (`.github/workflows/release.yml` + `scripts/release.sh`) for semver bumping, changelog generation, git tagging, GitHub Releases, and npm publishing with provenance.

## [1.0.0] - 2026-11-23

### Added

- **CORE CLI (`packages/initializer`)**: Atomic modular architecture (`src/commands/`, `src/modules/`, `src/ui/screens/`, `src/types/`, `src/assets/ascii/`) with `init`, `rules`, `mcps`, `normalize`, `update`, `validate`, and `generate` commands.
- **Animated Ink UI (`packages/ui-cli`)**: Powered by `@inkjs/ui@2.0.0` with custom `PlanetThemeProvider`, animated `PlanetBanner`, `StepProgress`, `DeliveryLoader`, `BenderCard`, and `/` searchable `MultiSelect`.
- **Web Design System (`packages/ui-web`) & Landing/Docs (`apps/web`)**: Next.js `15.5.29`, Tailwind CSS v4, ShadCN Radix primitives, Aceternity UI liquid glassy effects (Pro keys via `.env`), Dark/Light toggle, and exact Futurama SSt Ship & Silver Saks Bender ASCII illustrations.
- **Separated UI Packages on Init**: Automatic scaffolding of `packages/ui-cli` (`@inkjs/ui`), `packages/ui-web` (`ShadCN` + `Aceternity UI`), and `packages/ui-mobile` (for mobile frameworks).
- **Rules & Skills Marketplace (`templates/rules/` & `templates/skills/`)**: 28 context-selective rules (framework, language, financial domain, anti-doc-sprawl) and 12 skills across Open Code, Antigravity, Claude, Codex, and Cursor.
- **Verified Safe MCP Marketplace**: 26 audited official MCP servers (`nx`, `nextjs-devtools`, `shadcn`, `playwright`, `context7`, `ai-memory`, `stripe`, `drizzle`, `postgres`, `mongodb`, etc.) with `--recommend` stack matching and `mcp.json` + `.env.example` generation.
- **Strict Validation & Audited Dependencies**: Zod `4.6.7` validation across CLI args, TUI inputs, and `bootstrap.config.json`; Yarn v6 (`6.0.0-rc.23`) workspace config; zero unpinned ranges and active CVE detection.
- **Full Test Pyramid & Local Installer**: Unit & integration tests inside `src/**/__tests__/`, CLI & Playwright E2E tests in root `tests/e2e/`, and `~/.local/bin` installer (`scripts/install-local.sh`).
