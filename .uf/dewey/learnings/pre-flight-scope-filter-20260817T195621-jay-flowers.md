---
tag: pre-flight-scope-filter
author: jay-flowers
category: pattern
created_at: 2026-08-17T19:56:21Z
identity: pre-flight-scope-filter-20260817T195621-jay-flowers
tier: draft
---

When implementing instruction-only Markdown changes to skills (like the pre-flight scope filter addition), the full spec-review-implement-review pipeline still applies, but the coverage strategy must be explicitly adapted. Instead of traditional unit tests, use a three-tier approach: (1) automated scaffold drift detection via TestEmbeddedAssets_MatchSource to verify source and scaffold copies are byte-identical, (2) automated CI parity via make check to ensure no regressions, and (3) behavioral manual verification with a concrete checklist of items to confirm in the modified file. Constitution Principle IV requires the coverage strategy to be formally documented even for instruction-only changes — the strategy is different from compiled code but must still be defined.
