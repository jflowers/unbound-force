---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-19T16:42:07Z
identity: documentation-gate-20261019T164207-jay-flowers
tier: draft
---

Repair/recovery OpenSpec changes that self-identify as user-facing (e.g., a tasks.md CHANGELOG task describing the change as "user-facing workflow recovery behavior") must plan BOTH documentation-issue gates in the final task group, not just the CHANGELOG entry: the in-repo docs-labeled issue (AGENTS.md Documentation gate, required before PR merge) and the unbound-force/website issue (org constitution Cross-Repo Documentation rule, required before the implementing PR merges). Established precedent: PR #744 satisfied the gates via issue #740 + website#310 (learning content-pipeline-20261016T172845-jay-flowers), and the gold-standard review-dispatch spec template includes a documentation-gate task (learning openspec-quality-20261010T161811-jay-flowers). A CHANGELOG-entry task alone satisfies neither gate; without an explicit filing task, the "Verification and Documentation" group is an incomplete checkpoint and the gates are missed at implementation time. For content-pipeline triage on such changes, split the assessment: restoration behavior (success-scoping, status-derivation fixes) compares against the pre-break baseline and skips blog/tutorial issues, while genuinely new operator tooling (recovery tools, observability additions) has no baseline and warrants tutorial acknowledgment.
