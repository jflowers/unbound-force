---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-30T19:42:55Z
identity: openspec-20261030T194255-jay-flowers
tier: draft
---

In the unbound-force repo, an OpenSpec change that behaviorally modifies a MUST requirement owned by another active capability MUST carry a MODIFIED delta file for that capability — the established precedent is derive-per-run-timeout's specs/dispatch-recovery/spec.md, carried specifically to modify DR-FR-002 (fix-review-dispatch-recovery likewise ships two capability deltas). Prose acknowledgment in design.md is not a substitute: `openspec validate --strict` cannot detect cross-capability requirement contradictions, so a change that scopes another change's requirement (e.g., build-review-prompts FR-013's 2 MiB diff cap scoped to 'inline path only' by review-dispatch-diff-manifest) without a MODIFIED delta leaves the spec corpus self-contradictory post-archive, and a future implementer reading the unmodified requirement as governing will restore forbidden behavior. Verified in review of review-dispatch-diff-manifest (2026-10-30): contradictions at openspec/changes/build-review-prompts/specs/build-review-prompts.md:85,98-100,334,345,348-350 and openspec/changes/fetch-pr-review-context/specs/fetch-pr-review-context.md:107,115-116,168-169,189 vs openspec/changes/review-dispatch-diff-manifest/specs/review-dispatch/spec.md:27,35-38 and tasks.md:48-49,71-76.
