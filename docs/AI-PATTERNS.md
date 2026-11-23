# AI Collaboration & Anti-Doc-Sprawl Patterns

> Keep AI agents fast, accurate, and high-signal by preventing documentation bloat and context dilution.

## Core Principles

1. **One Canonical Source per Concern**

   - `README.md` — Project overview, quick start, and architecture map.
   - `CONTRIBUTING.md` — Commit rules, PR checklist, and testing rules.
   - `.ai/rules/*.md` — Active enforceable constraints for _this_ repository only.
   - `.ai/skills/*/SKILL.md` — Active repeatable agent workflows for _this_ repository only.
   - `templates/` — Reusable marketplace templates for _other_ projects (not loaded into this repo's active AI context unless needed).
   - `apps/web/src/app/docs/` — User-facing documentation site.

2. **Never Create Ephemeral or Duplicate Markdown Files**

   - Do **not** create `NOTES.md`, `CHANGES.md`, `SUMMARY.md`, `ARCHITECTURE_V2.md`, `PLAN_FINAL.md`, or per-feature design dumps in the repo root.
   - Update existing canonical files in place instead of creating sibling files.

3. **Keep Every Rule High-Signal & Under ~60 Lines**

   - Use terse, imperative bullet points (`DO` / `DON'T`).
   - Avoid multi-paragraph prose, motivational filler, or repeating TypeScript/ESLint defaults that tools already enforce.
   - Prefer deterministic automated checks (Zod, TypeScript strict, Vitest, Playwright, OpenGrep) over prose reminders.

4. **Context-Selective Rule Loading**

   - Only place rules matching the project's actual stack and domain inside `.ai/rules/`.
   - Example: A TypeScript + Ink + Next.js repo loads `ink-anti-patterns.md` and `nextjs-anti-patterns.md`, while `mobile-anti-patterns.md`, `rust-anti-patterns.md`, and `financial-rules.md` remain in `templates/rules/` until initialized into a matching project.

5. **Synchronize Docs Only on Behavioral Changes**
   - Update docs when CLI commands, architecture, public contracts, or setup steps change.
   - Skip doc churn for purely internal refactors that preserve all contracts.
