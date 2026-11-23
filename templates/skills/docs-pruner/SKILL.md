---
name: docs-pruner
description: Audit markdown files to prevent documentation sprawl, stale notes, and bloated AI rules
---

# Docs Pruner (Anti-Doc-Sprawl Skill)

1. List all `*.md` files outside `node_modules/`, `dist/`, and `templates/`.
2. Flag ephemeral/duplicate files (`NOTES.md`, `TODO.md`, `SUMMARY.md`, `*_V2.md`, redundant guides).
3. Check `.ai/rules/*.md` line counts — flag any rule exceeding 80 lines for tightening into high-signal bullets.
4. Verify no inactive-stack rules (e.g. `rust-anti-patterns.md` in a pure TypeScript repo) pollute `.ai/rules/`; move reusable templates to `templates/rules/`.
5. Confirm `README.md`, `CONTRIBUTING.md`, and `docs/AI-PATTERNS.md` are concise and mutually non-duplicative.
