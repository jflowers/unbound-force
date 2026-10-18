---
tag: documentation-gates
author: jay-flowers
category: gotcha
created_at: 2026-10-17T22:21:46Z
identity: documentation-gates-20261017T222146-jay-flowers
tier: draft
---

Unbound Force spec artifacts must assess every applicable documentation gate, not just the most visible one. Two gates coexist for command/workflow changes: (1) the repo-local AGENTS.md documentation gate (docs issue against the current repo) and (2) the org constitution's Cross-Repo Documentation rule (GitHub issue in unbound-force/website before PR merge for changes affecting user-facing behavior, hero capabilities, CLI commands, or workflows; exempt only purely internal refactoring/test-only/CI-only changes). The meta repo's current AGENTS.md bullet mentions only the current-repo issue, so the website requirement is easy to miss — it lives in the constitution's Development Workflow section and in earlier AGENTS.md revisions (documented in specs/030-agents-md-guidance). The house pattern, per openspec/changes/fix-uf-init-command-rename-migration/proposal, is a Documentation Impact section with one line per surface: CHANGELOG.md (entry needed), AGENTS.md (changed/exempt), and Website docs issue (filed/exempt with rationale). A command-instruction rewrite with a preserved behavioral contract still requires the explicit exempt-or-file decision, because neither gate's exemption list covers instruction-prose rewrites.
