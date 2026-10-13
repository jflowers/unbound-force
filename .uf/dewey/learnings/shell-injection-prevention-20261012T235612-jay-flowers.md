---
tag: shell-injection-prevention
author: jay-flowers
category: gotcha
created_at: 2026-10-12T23:56:12Z
identity: shell-injection-prevention-20261012T235612-jay-flowers
tier: draft
---

When creating TypeScript MCP plugins that call external CLI binaries (git, gh), apply the shell-free subprocess pattern uniformly. The uf-finale plugin initially used execSync (shell mode) for both git and gh operations, which the adversary reviewer flagged for shell injection risk. The fix involved two patterns: (1) For git operations, use an injectable GitExec type backed by execFileSync("git", args) to avoid shell interpolation entirely. (2) For gh operations where execSync is used, validate all interpolated parameters before constructing the command string — for example, validating targetRepo matches ^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$ and prNumber is a finite integer in range 1-999999. Input validation should happen before any side effects (temp file creation, etc.) to maintain the fail-fast principle. A future improvement would be to create a generic CliExec abstraction for all subprocess calls, not just git.
