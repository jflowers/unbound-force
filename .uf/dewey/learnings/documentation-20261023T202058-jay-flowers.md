---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-23T20:20:58Z
identity: documentation-20261023T202058-jay-flowers
tier: draft
---

When a review-phase discovery disproves a factual claim in a change's design.md, the correction must be fed back into the design artifact in the same fix commit, not only captured as a retrospective Dewey learning — otherwise the PR ships internally inconsistent: its code and test changes prove the design claim false while the design record still asserts it. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR 812, 2026-10-23): design D8 claimed "no step-number references outside the command file and its scaffold mirror"; review grep found step-number references in six sibling unarchived changes (triage-mandatory-gate, finale-reliability, mandatory-gate-hardening, issue-pr-traceability, finale-secrets-askuser-gate, finale-dewey-commit) plus the golden-suite line anchors. The learning content-pipeline-20261023T133532 recorded the discovery, but D8 and the Risks section ("mitigated by the audit (no external references)") still carried the false claim at head, and the per-reference dispositions (D9-style historical vs live) lived only in the learning. Recipe: when a review finding invalidates a design-doc rationale, amend the affected decision — or append a follow-up decision recording the corrected audit result and each reference's disposition — alongside the code fix; the learning records the pattern, the design record must record the facts.
