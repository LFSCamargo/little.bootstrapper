---
name: security-checker
description: Run OpenGrep SAST and GitLeaks secret scanning
---

# Security Checker (OpenGrep + GitLeaks)

Run `opengrep scan --config .opengrep.yml` and `gitleaks detect --config .gitleaks.toml --source .` before opening a PR.
