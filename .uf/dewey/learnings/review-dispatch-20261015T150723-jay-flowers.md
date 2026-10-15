---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-15T15:07:23Z
identity: review-dispatch-20261015T150723-jay-flowers
tier: draft
---

The review-dispatch plugin (.opencode/plugins/review-dispatch/index.ts) keys ONE correlation per parent opencode session (sessionCorrelationMap, index.ts:568) and persists session_metadata only on the FIRST dispatch call in a session (index.ts:2713-2730). When /uf.unleash legitimately runs TWO dispatches in one conversation (spec review then code review), the second dispatch's runs overwrite the first's run-<agent>.json files (same session dir), and its session_metadata is validated but ignored. If the head SHA moved between dispatches (it does: implementation commits land between spec review and code review), consolidate_dispatch fails fail-closed with "artifact commit must equal the immutable reviewed head SHA" (validateContext, index.ts:2269) because the payload mixes the stale first-dispatch metadata with the new runs. Recovery that preserves both artifacts: update $TMPDIR/opencode/dispatch-<correlation>/session-metadata.json to the latest dispatch's metadata (the exact schema-valid session_metadata object passed to dispatch_review_runs), then re-run consolidate_dispatch with the current provenance — artifact publishing is collision-safe (persistEnvelope retries with a fresh UUID on EEXIST, index.ts:2340-2394), so the first dispatch's artifact at .uf/artifacts/dispatch/<correlation>.json is preserved and a new artifact file is written for the second dispatch. Proper fix for the plugin: key session correlation by (session, dispatch sequence) or persist metadata per dispatch rather than per session. (Provenance: branch opsx/address-feedback-model-normalization, 2026-10-15, /uf.unleash run; observed by the coordinating session.)
