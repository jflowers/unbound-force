---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:50:27Z
identity: documentation-gate-20261022T225027-jay-flowers
tier: draft
---

Curator docs-gate verification must re-check live issue state after any recorded maintainer exemption, and must use an UNLABELED search in addition to label-filtered duplicate checks. On opsx/spec-review-per-finding-gate (iteration 2, 2026-10-22), the change record carried a dated maintainer exemption stating "no repo docs issue filed per maintainer decision" — but the maintainer later filed issue #789 for the same change (2026-10-22T19:01:52Z) without updating tasks.md/proposal.md, leaving the record asserting a gate outcome that no longer held. Two compounding mechanics: (1) an exemption record that outlives its own exemption misstates the gate outcome in the conservative direction and hides the tracking issue from auditors; (2) the maintainer-filed issue lacked the docs label, so label-filtered searches missed it — only an unlabeled keyword search for the change name surfaced it. Pattern: when a change record claims a docs-gate exemption, run an unlabeled title/keyword search for the change name in the target repo (and the website repo for the cross-repo gate) before accepting the record; if an issue exists, the record should cite it rather than the superseded exemption.
