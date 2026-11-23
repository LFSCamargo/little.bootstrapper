# Rule: ai-docs-discipline

> Prevent documentation sprawl and LLM context dilution across Open Code, Antigravity, Claude, Codex, and Cursor.

- **One truth per concern**: Update `README.md`, `CONTRIBUTING.md`, `.ai/rules/`, or `docs/AI-PATTERNS.md` in place; NEVER spawn throwaway `NOTES.md`, `SUMMARY.md`, or duplicate architecture docs.
- **Keep rules concise (<60 lines)**: Write imperative `DO` / `DON'T` rules. Remove filler prose and anything already enforced mechanically by TypeScript, linters, or tests.
- **Context-selective rules**: Keep only rules relevant to this repository's active stack in `.ai/rules/`; store reusable rules for other stacks in `templates/rules/`.
- **Prune stale docs**: When removing a feature, package, or command, delete or update every doc reference in the same commit.
