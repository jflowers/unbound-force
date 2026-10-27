---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-27T18:28:39Z
identity: documentation-gate-20261027T182839-jay-flowers
tier: draft
---

A docs-gate issue with a Dispositions section does not by itself satisfy the org constitution's Cross-Repo Documentation gate. In unbound-force/unbound-force (replicator-version-floor review, 2026-10-27), the local docs-gate issue (#844) followed the model Dispositions pattern yet still left its Website line as an unresolved conditional ("no website tracking issue known for this change; link one here if the website documents uf doctor output"), and tasks.md carried only one docs-issue task targeting the current repo — so the constitution's before-merge website-repo MUST reached the review council unresolved, at the last checkpoint where it can still be verified. Rule: the Website disposition line must resolve to a filed issue number or an explicit not-applicable decision with rationale before the review council runs, and tasks.md needs one task per gate, each recording its filed issue number at filing time (exemplar: dispatch-finalize-determinism tasks 4.4/4.6).
