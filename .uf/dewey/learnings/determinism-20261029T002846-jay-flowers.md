---
tag: determinism
author: jay-flowers
category: gotcha
created_at: 2026-10-29T00:28:46Z
identity: determinism-20261029T002846-jay-flowers
tier: draft
---

From uf-fix-ci spec review (2026-10-28): new /uf.* command specs cannot satisfy the determinism gate (DE-001/DE-005) by routing only git ops and CI polling through plugin tools. The gh-driven choreography — prereq existence checks, PR state fetch/parse, eligibility matrices, fork-aware remote resolution, per-check log enumeration — is exactly the 'mechanical procedural prose' the pack forbids adding where tools are feasible. Feasible tools exist and are frequently unconsidered: fetch_pr_review_context (extendable with state/mergeable/mergeStateStatus/headRepository/baseRepository), uf_finale_base_state + resolve_base_ref (fork-aware remote resolution), uf_finale_ci_poll (CI polling). Proposal Principle VI PASS rationales claiming 'mechanical steps execute through existing tools' must be checked against the full step inventory, not just the git-op subset. Counter-example worth emulating: every repo-factual claim in uf-fix-ci's artifacts verified exactly (scaffold_test.go:1855 'OpenCode commands (11)' comment, loadCommandCopies at command_contract_test.go:377, dispatch-contract test names at :254/:290/:329, openspec/specs baseline {ci, graphthulhu-distribution, review-council}, CHANGELOG '(Spec: ...)/(Docs: ...)' footer format, docs tables at usage.md:255 and architecture.md:529, uf.address-feedback §4.3 council-gate precedent, tasks.md [P] preamble matching the repo-wide template).
