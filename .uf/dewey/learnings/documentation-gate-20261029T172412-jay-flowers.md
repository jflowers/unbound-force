---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-29T17:24:12Z
identity: documentation-gate-20261029T172412-jay-flowers
tier: draft
---

Cross-repo documentation-gate exemptions self-contradict when the same spec classifies the changed surface as user-facing for the sibling gate: the unbound-force org constitution's Cross-Repo Documentation rule triggers independently on four conditions (user-facing behavior, hero capabilities, CLI commands, workflows), so an exemption resting solely on "observable command behavior unchanged" leaves the other triggers unaddressed — and scaffold-mirrored plugin tools (shipped byte-identical to every uf-init consumer) are deployed capability surface, not purely internal plumbing. Seen in spec review of openspec/changes/extend-fetch-pr-review-context (2026-10-29): the proposal filed the repo-local docs issue because "new plugin tools are user-facing capability surface" while exempting the website issue because "/uf.fix-ci's observable behavior is unchanged" — the same surface cannot be user-facing for one gate and beneath the other's threshold unless the rationale addresses the differing trigger lists. Exemptions also inherit the search-first convention: keyword-search the website repo's open issues for the affected command/tool names before claiming the threshold is unmet (unbound-force/website#342 carried the /uf.fix-ci command reference and #310 tracked plugin tool parameter behavior — both on-point, both unmentioned), then reference/consolidate or record the per-trigger exemption basis.
