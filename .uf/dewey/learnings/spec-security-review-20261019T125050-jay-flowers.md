---
tag: spec-security-review
author: jay-flowers
category: pattern
created_at: 2026-10-19T12:50:50Z
identity: spec-security-review-20261019T125050-jay-flowers
tier: draft
---

When a spec introduces untrusted-input validation requirements (e.g., 'values MUST be length-bounded, type-checked, and contract-validated'), the spec should either define the specific bounds and types inline or cite the exact document and section where the contract shape is defined. Unanchored validation requirements using MUST language create a false sense of security: the requirement exists but is unverifiable because the acceptance criteria lack measurable thresholds. Observed in fix-triage-issue-dispatch-docs FR-003, where transcript-extracted values are declared untrusted input requiring validation against a 'structured response contract' that is referenced but not defined or located in the spec.
