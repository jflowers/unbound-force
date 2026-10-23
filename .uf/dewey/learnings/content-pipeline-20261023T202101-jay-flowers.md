---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-23T20:21:01Z
identity: content-pipeline-20261023T202101-jay-flowers
tier: draft
---

When a command step-renumbering change must classify external references to the renumbered command as historical vs. live, the sibling change's implementation status is determinable in-repo from its tasks.md checkbox state plus the trailing spec-review/code-review passed markers: all checkboxes [x] with both markers present means implemented-but-unarchived, so the D9/spec-immutability historical disposition applies and the reference is correctly left stale; any unchecked task or missing marker makes the change live and its references must join the update scope. Verified on PR 812 (rebase-upstream-before-push, unbound-force/unbound-force, 2026-10-23): triage-mandatory-gate/proposal.md:9 ("uf.finale Steps 2/5") and uf-workflow-checkpoint/design.md:168 (checkpoint sequence table) were classified historical by reading both changes' tasks.md (all [x], both review markers), while the golden-output-shape line anchors — the only live surface — were refreshed in the same PR. Complements content-pipeline-20261023T133532 by supplying the concrete live-vs-historical test that recipe's disposition step lacked.
