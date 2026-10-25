---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-25T20:09:56Z
identity: review-dispatch-20261025T200956-jay-flowers
tier: draft
---

Dispatched Curator runs whose review prompt carries Prohibitions (no issue creation, no external service access) must treat those prohibitions as overriding the agent definition's gh filing mandate and degrade per spec 026 (documentation-curation): report blocking findings plus proposed curation actions, never file. Verification recipe that closes the content-pipeline gate without tracker access: (1) triangulate in-diff evidence — CHANGELOG back-references with full repo qualifiers, the checked tasks.md documentation-gate task, and diff learning files; (2) verify inherited documentation asks against the working tree rather than the tracker (on fix-init-speckit-sentinel PR #828, grepping README.md confirmed the `uf init` description at line 67 omits the starter constitution, proving the #478 README ask un-resolved without touching GitHub); (3) apply the documentation-20261014T165443 rule — a learning in the diff that documents an orphaned tracking item is evidence OF the gap, not closure of it — and anchor the finding to that learning's changed line; (4) delegate read-only `gh issue view` verification of recorded issue numbers to the consolidating parent, which retains tracker access.
