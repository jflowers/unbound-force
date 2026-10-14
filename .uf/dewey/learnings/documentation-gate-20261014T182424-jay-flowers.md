---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:24:24Z
identity: documentation-gate-20261014T182424-jay-flowers
tier: draft
---

When an OpenSpec/Speckit task bundles in-repo documentation work with out-of-repo obligations that carry future deadlines (e.g., a constitution-mandated GitHub issue due 'before PR merge'), checking the task [x] when only the in-repo portion is done makes the remaining obligations unauditable: nothing in the repository records that a filing is still owed, and workflow consumers (/uf.finale, human reviewers, archive agents) treat the checked box as full completion. Observed in unbound-force fix-tui-git-output-leak (2026-10, council iterations 1-2): tasks.md 3.4 was checked while the unbound-force/website tracking issue was unfiled and docs issue #710 unupdated; the finding survived two review iterations because remediation required GitHub access the review session prohibited. Pattern: split deadline-bound out-of-repo sub-items into their own task whose text names the deadline, or record a pending-obligations note in the proposal's Documentation Impact section (what must be filed, in which repo, by when) and append the issue URLs at filing time — so the pre-PR constitution gate is mechanically checkable instead of trusting a premature checkbox.
