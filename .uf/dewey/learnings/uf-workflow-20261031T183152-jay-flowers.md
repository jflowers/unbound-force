---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-31T18:31:52Z
identity: uf-workflow-20261031T183152-jay-flowers
tier: draft
---

On a resumed /uf.unleash run (opsx/reviewer-capabilities-init-survival, 2026-10-31), the Step 6 code-review pre-flight soft gate can adopt a recorded green phase checkpoint as its PASS evidence instead of re-running the full aggregate: the implement-phase-3 checkpoint recorded make check fully green (empty failure inventory) at 17:23:29Z on the exact working tree under review, the only subsequent commit flipped tasks.md checkboxes (outside every check's scope), and git status confirmed the identical six-file modification set. The freshness policy that makes this sound: verify tree identity cheaply (git status short list, git log of commits since the checkpoint timestamp, worktree HEAD SHA), cite the checkpoint's recorded verdict, inventory, and timestamp as the evidence, and document the derivation in the pre_flight_results string passed to dispatch_review_runs. This honors the session-resume guard's never-re-run-green principle and the zero-waste behavioral rule without weakening the gate — any mismatch between the recorded state and the current tree falls back to actually running the checks.
