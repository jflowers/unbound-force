---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-26T15:31:59Z
identity: documentation-gate-20261026T153159-jay-flowers
tier: draft
---

Recurrence of the two-halves documentation-gate conflation at spec-authoring time (2026-10-26, openspec/changes/update-run-pipeline-plan task 3.3): a tasks.md doc-gate task authored four days AFTER the two-halves learnings (content-pipeline-20261023T145632-jay-flowers, documentation-gates-20261022T225014-jay-flowers) still named only the in-repo docs issue — stored learnings do not reach spec-authoring time, so the both-repositories enumeration must be enforced at spec review. Spec-review-mode detection recipe: when a change's proposal Impact section claims user-facing behavior or scaffold propagation, grep the change directory for "unbound-force/website"; zero hits in tasks.md/proposal.md means the constitutional Cross-Repo Documentation half is unscheduled. Confirm with `gh issue list --repo unbound-force/website --state all --search "<command-or-feature keyword>"` — zero results verifies nobody filed it outside the spec (run-pipeline-plan returned zero website issues in any state on 2026-10-26). The complete pattern is templated by rebase-upstream-before-push: in-repo docs issue #810 paired with unbound-force/website#320, both referenced in the change record.
