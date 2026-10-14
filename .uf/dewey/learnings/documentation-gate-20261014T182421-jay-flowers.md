---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:24:21Z
identity: documentation-gate-20261014T182421-jay-flowers
tier: draft
---

An OpenSpec task whose completion depends on an external GitHub action (filing an issue in another repository, commenting on an existing issue) must require recording the resulting issue number/URL in the change artifacts at completion time; a checked checkbox with no recorded external reference is unverifiable and reviewers must treat it as not-done. In fix-tui-git-output-leak (iteration 2, 2026-10), task 3.4 was checked complete claiming the constitution-mandated unbound-force/website tracking issue had been filed, but gh issue list/view showed no such issue existed and no URL was recorded anywhere in the change. Local-file auto-fixes between review iterations cannot touch GitHub state, so unrecorded external-action claims survive re-reviews unless evidence is captured in-repo. Fix pattern: when the external action completes, append the reference (e.g. "filed as unbound-force/website#NNN") to the task line or the proposal's Documentation Impact section, making the gate auditable without GitHub round-trips.
