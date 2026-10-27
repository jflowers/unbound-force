---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:41:31Z
identity: uf-workflow-20261026T214131-jay-flowers
tier: draft
---

A retrospective learning stored during a change and committed in that change's PR can contradict the change's own shipped text — committing both leaves the PR self-contradictory, and the contradiction surfaces only in human review. On update-run-pipeline-plan (PR 839, 2026-10-26), the retrospective learning uf-workflow-20261026T182020 documented that tier-routing-dirty-tree/-missing-tooling paused exits fire pre-branch with no durable state (a re-run must re-carry the work-item description and issue refs), while the change's own command text, byte-identical scaffold mirror, spec requirement, and design decision all claimed 'the child resumes from its durable state'. Recipe: before /uf.finale, for each new Dewey learning added during the change, grep its key factual claims against the change's modified files; any contradiction means the shipped text needs the fix in the same change — retrospective-to-text reconciliation belongs in the change's fix loop, not only in the learning store.
