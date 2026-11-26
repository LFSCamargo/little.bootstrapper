# Contributing to little.bootstrapper

Good news, everyone! We welcome contributions to the little.bootstrapper crew.

## Ground Rules

1. **Yarn Workspaces**: Use `yarn` for all workspace commands (`yarn install`, `yarn build`, `yarn test:unit`, `yarn test:integration`, `yarn test:e2e`, `yarn typecheck`).
2. **Pinned Audited Versions Only**: Never add `^` or `~` version ranges to any `package.json`. Run `yarn cli update --check` to verify all dependencies against the audited registry.
3. **Conventional Commits**: Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
4. **Universal AI Rules**: All changes must respect `.ai/rules/*.md` — including `quality-gating.md`, `security.md`, `test-driven.md`, `e2e-testing.md`, and `docs-sync.md`.
5. **Separated UI Packages**:
   - Place reusable CLI UI components (React Ink) inside `packages/ui-cli`.
   - Place reusable Web UI components (ShadCN + Aceternity UI) inside `packages/ui-web`.
   - Mobile projects initialized via the CLI place reusable Mobile UI components inside `packages/ui-mobile`.
6. **Test Placement**: Store unitary (`*.unit.test.ts`) and integration (`*.integration.test.ts`) tests close to implementation inside `__tests__/` folders (`src/**/__tests__/`), and keep root `tests/e2e/` exclusively for End-to-End tests.

When changing native workspace generation, run generator integration tests and the opt-in native toolchain E2E suite documented in README.md. Cover Cargo-safe names, Rust/TypeScript shared contracts, every supported Rust and Go backend framework, JSON wire compatibility, and the generated frontend's build/test graph. Preserve existing user files when repairing previously generated workspaces.

Initialization regressions must exercise generated commands, not just compare file contents. The integration matrix covers architectures, naming, and test placement; opt-in `PACKAGE_MANAGER_TESTS=1` and `NATIVE_TOOLCHAIN_TESTS=1` suites install dependencies and run actual toolchains. Keep unsupported templates explicitly rejected before filesystem writes, and document support gaps in README.md.
