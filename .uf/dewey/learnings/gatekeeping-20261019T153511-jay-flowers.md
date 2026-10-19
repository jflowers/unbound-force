---
tag: gatekeeping
author: jay-flowers
category: pattern
created_at: 2026-10-19T15:35:11Z
identity: gatekeeping-20261019T153511-jay-flowers
tier: draft
---

When a review council examines a gatekeeping-protected change AFTER the human maintainer has documented an explicit override of a prior council's REQUEST CHANGES (clarification-marker-superset D7: pinned @opencode-ai/plugin 1.4.10→1.19.0 with the gatekeeping exception's security/CI-reliability justification condition unsatisfied), the correct posture is a non-blocking governance record, not a re-flag at the original severity and not silence. Verify four things before accepting: (1) the human authorization is documented in-repo (design/proposal/CHANGELOG, plus the overridden council verdict); (2) every enforcement gate still enforces at the new value — all pin records moved together (manifests, scaffold mirrors, exact-version test constants, testdata baseline hashes, spec MUST records via a MODIFIED delta, AGENTS.md); (3) the protected value remains exact and immutable (no mutable tag or name-addressed ref); (4) rollback plus reproducible validation evidence exist. When all four hold, classify the unsatisfied exception condition as MEDIUM and name the PR review and CI approval as the completing conditions of the exception path. Re-flagging at HIGH post-override contradicts the governance model in which the human is the final gate authority (agents report and stop; the human decides); staying silent erases the audit trail. The complementary spec-review-time rule (flag as HIGH, council verdict is the remaining gate) is captured in dependency-governance-20261019T111053.
