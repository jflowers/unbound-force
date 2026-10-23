---
tag: command-prose
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:49:52Z
identity: command-prose-20261022T224952-jay-flowers
tier: draft
---

When a spec delta governs multiple command embeddings (e.g. /uf.unleash and /uf.review-council) plus a scaffold mirror, verify every new MUST/MUST NOT in all copies: entry/skip conditions, checkpoint wiring, and scenario coverage diverge easily when one file is rewritten end-to-end and the others are edited in place. Carry-overs from the old text (a retained skip condition contradicting a new scenario) and mechanisms wired into only one embedding (a checkpoint call specified in the pipeline command but not the standalone command) are the two recurring failure modes; diff-review each embedding against every delta scenario before declaring the task complete. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
