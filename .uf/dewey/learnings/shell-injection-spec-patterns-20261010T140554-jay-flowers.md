---
tag: shell-injection-spec-patterns
author: jay-flowers
category: pattern
created_at: 2026-10-10T14:05:54Z
identity: shell-injection-spec-patterns-20261010T140554-jay-flowers
tier: draft
---

When specifying tools that execute shell commands (BunShell, child_process, exec) with user-provided input, the spec MUST explicitly require: (1) only validated values reach shell commands, not raw input; (2) shell output from external tools (gh CLI, git) is treated as untrusted data; (3) upper bounds on numeric inputs that reach shell arguments (e.g., PR numbers 1-999999). The council-review-action D4 decision and review-council-github-posting D7 pattern are the canonical references for these requirements in the unbound-force ecosystem.
