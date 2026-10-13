---
tag: shell-injection-prevention
author: jay-flowers
category: pattern
created_at: 2026-10-13T02:16:09Z
identity: shell-injection-prevention-20261013T021609-jay-flowers
tier: draft
---

When reviewing TypeScript MCP plugins that call external CLI binaries, check for consistency in subprocess execution patterns. The uf-finale plugin demonstrates a split pattern: git operations use the shell-free `execFileSync` via an injectable `GitExec` type (safe by construction), while `gh` CLI operations use `execSync` (shell mode) with manual input validation. Both patterns can be made safe, but the shell-free pattern is structurally safer because it eliminates the entire class of shell metacharacter injection. When `execSync` is used, verify that every interpolated value is either: (1) a hardcoded string, (2) a validated integer, or (3) validated against a strict allowlist regex. The `uf_finale_create_pr` tool's title escaping covers backticks, `$()`, `${}`, double quotes, and backslashes but does not cover newlines or carriage returns, which could break the shell command in unexpected ways.
