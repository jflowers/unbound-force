---
tag: determinism
author: jay-flowers
category: gotcha
created_at: 2026-10-16T15:26:53Z
identity: determinism-20261016T152653-jay-flowers
tier: draft
---

When two tools consume the same textual marker, derive both grammars from a single shared pattern/constant. In uf-workflow, the resume probe used a prefix match ("[NEEDS CLARIFICATION") while the extractor required the colon form ("[NEEDS CLARIFICATION: question]"). Divergent grammars create a silent-bypass path: a bare hand-written marker makes the resume detector report the step incomplete forever while the extractor returns zero items, so the command announces "No clarification needed" and proceeds past an unaddressed marker without surfacing it. Prefer making the extractor handle the superset (extract bare forms as unscoped questions) so fail-safe detection stays paired with visibility, rather than broadening only the detector. (Round-2 council, run 16a15ccc, artifact 8601976b.)
