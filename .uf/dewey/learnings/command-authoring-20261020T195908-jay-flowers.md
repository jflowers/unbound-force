---
tag: command-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:59:08Z
identity: command-authoring-20261020T195908-jay-flowers
tier: draft
---

When inserting a tier-conditional block into an existing multi-step command document, every paragraph of the inserted block needs its own explicit tier marker or must be nested under a marked bullet. Adjacency to an opening 'If WORKFLOW_TIER = X' marker does not survive paragraph breaks: a later top-level paragraph reads as unconditional to an agent following the step linearly, and trailing continuation sentences ('On failure ... proceed directly to Step N') inherit ambiguous antecedents. In unbound-force PR #784, the quick pre-flight hard-gate paragraph in uf.unleash.md Step 5 (line 679) sat at top level after the quick conditional, making a quick-only blocking gate read as unconditional for speckit/openspec runs — flagged MEDIUM by divisor-guard. Scaffold mirror files duplicate command text byte-for-byte, so the defect and its fix must be synchronized across both copies.
