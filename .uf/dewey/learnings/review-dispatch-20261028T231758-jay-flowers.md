---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-28T23:17:58Z
identity: review-dispatch-20261028T231758-jay-flowers
tier: draft
---

When asserting integration wiring for a computed value, a typeof-only check cannot catch silent fallbacks. In the derive-per-run-timeout change, dispatch_review_runs records prompt_bytes from a promptSizeMap.get(agent) ?? 0 lookup; the dispatch-path test asserted only typeof prompt_bytes === "number", so a key-mismatch regression zeroing the prompt term (the exact under-provisioning failure mode from issue #849) would pass every test — the formula-consistency recomputation from recorded provenance fields holds for any prompt_term_ms value. The fix pattern already existed in the same change's redispatch test: assert prompt_bytes equals Buffer.byteLength of the persisted prompt file. Rule of thumb: when production code contains a `?? default` fallback on a map/object lookup that feeds a recorded metric, the integration test must pin the exact value against the real source, never just its type.
