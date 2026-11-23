---
name: mcp-security-audit
description: Audit mcp.json and agent MCP bridges for verified servers, read-only flags, and zero hardcoded secrets
---

# MCP Security Audit Skill

1. Inspect `mcp.json`, `.cursor/mcp.json`, and `.mcp.json` across the repository.
2. Verify every configured MCP server ID exists in the little.bootstrapper Verified Safe MCP Catalog (`little-bootstrapper mcps --list`).
3. Reject any raw token, API key, or connection string literal inside `mcp.json`; enforce `${ENV_VAR}` placeholders documented in `.env.example`.
4. Confirm database MCPs (Postgres, Supabase, MongoDB) use read-only scopes by default.
