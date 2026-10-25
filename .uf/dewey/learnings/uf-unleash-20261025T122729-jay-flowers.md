---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-25T12:27:29Z
identity: uf-unleash-20261025T122729-jay-flowers
tier: draft
---

When a shared control-flow block is wired into multiple gates of a command template, each entry point must independently enforce the block's entry invariants — a general exclusion clause stated once is not self-enforcing at a call site that lacks the classification mechanism it presupposes. In PR #815's build/test fix loop, 'Pre-existing and environmental failures never enter the loop' was honored at the phase checkpoint (via the green-when-all-failures-pre-existing/environmental verdict rule) and at Step 6 (explicit branch-caused/unknown filter per the pre-flight skill's Phase 4b), but the quick-tier gate's 'If any check fails' entry invoked the loop unfiltered, and the CHANGELOG published the invariant as if all three gates enforced it. Gate-wiring checklist for shared loop/gate blocks: (1) enumerate every entry point that references the block, (2) for each, name the concrete mechanism that enforces the block's entry filter, (3) verify any CHANGELOG/behavioral claim against the weakest-wired gate, not the strongest, and (4) update the canonical template and its scaffold mirror byte-identically (go.md TC-007 drift contract).
