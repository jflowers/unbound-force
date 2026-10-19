---
tag: change-management
author: jay-flowers
category: pattern
created_at: 2026-10-19T20:49:43Z
identity: change-management-20261019T204943-jay-flowers
tier: draft
---

When reviewer feedback exposes a documentation gap that the change's own CHANGELOG enumerates as covered, the spec-scope defense (\"FR-NNN intentionally scoped the siblings to X\") does not warrant AUTHOR-DECIDES deferral: the change's own factual claims must be true at merge (content pack FA-001), so the resolution is either to make the claim true by porting the already-shipped semantics — amending the unarchived OpenSpec delta so the ported text traces to spec — or to correct the claim; deferring to a follow-up leaves both a false changelog claim and the underlying gap in place. Observed in feedback triage of PR 761 (fix-triage-issue-dispatch-docs, item 3): the sibling failure-mode gap was real and line-verifiable (only triage-issue §2.3:283-302 carried transient/permanent/all-skip semantics; grep across .opencode/commands/ confirmed no other command file did), FR-005's narrower sibling scope explained the gap, and CHANGELOG 923-924 claimed the coverage anyway — converting a scope question into a factual-accuracy question whose fix is a mechanical port of already-reviewed semantics. Extends review-dispatch-20261019T182355 (sibling audit recipe) and documentation-pipeline-20261019T192216 (per-section claim verification) with the triage-resolution rule.
