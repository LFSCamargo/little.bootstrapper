---
name: mcp-security-audit
description: Audit mcp.json for verified MCP servers, read-only modes, and zero hardcoded secrets
---

# MCP Security Audit Skill

Verify all entries in `mcp.json` come from `little-bootstrapper mcps --list`, use `${ENV_VAR}` placeholders, and enforce read-only DB modes.
