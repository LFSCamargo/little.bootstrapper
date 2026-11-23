# Rule: security

> little.bootstrapper Universal AI Rule (Core) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Never commit secrets, API keys, or credentials. Use `.env` and `.env.example`.
- Run OpenGrep (`.opengrep.yml`) and GitLeaks (`.gitleaks.toml`) checks before merging.
- Validate and sanitize all external inputs at system boundaries (e.g. Zod schemas).
