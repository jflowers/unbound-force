---
tag: documentation-completeness
author: jay-flowers
category: gotcha
created_at: 2026-10-31T13:58:27Z
identity: documentation-completeness-20261031T135827-jay-flowers
tier: draft
---

OpenSpec documentation tasks must restate the file scope of their spec-delta requirements verbatim, and spec reviewers should verify that a 'matching the documented semantics of X' scenario actually has a referent on the target page. In the reviewer-capabilities-init-survival spec review (2026-10-31), proposal.md and the scaffold-ownership spec delta both required 'symmetric seeding and survival semantics for both review-config files' in docs/architecture.md AND docs/configuration.md, but tasks.md 2.2 drifted to naming only .uf/reviewer-capabilities.yaml for configuration.md — while docs/configuration.md documents neither review-config file's survival semantics today (purpose-only table at lines 272-277, zero ownership/re-run/survive matches in the file). Executing the task as written would leave the verification scenario's 'matching the documented semantics of .uf/review-matrix.yaml' clause with no referent on that page. Rule: when a requirement mandates documentation for N files across M pages, each docs task enumerates exactly which file x page pairs it covers; before approving, grep the target page for the semantics a 'matching X' scenario presumes.
