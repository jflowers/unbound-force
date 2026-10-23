---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:05:46Z
identity: documentation-gate-20261020T170546-jay-flowers
tier: draft
---

When review feedback changes an output contract mid-iteration (e.g., always-present arrays → omitted-when-empty keys), re-verify prose artifacts written earlier in the change, especially CHANGELOG entries. Observed on PR #776: the CHANGELOG claimed consolidate_dispatch results "always carry" warnings/proposals fields after review feedback had changed the code to omit them when empty.
