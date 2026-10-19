---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T18:24:01Z
identity: review-dispatch-20261019T182401-jay-flowers
tier: draft
---

review-dispatch session collision (tracked as unbound-force/unbound-force#760): running a second review dispatch in the same opencode session reuses the first dispatch's correlation ID, and session-metadata.json is persisted first-call-only (index.ts ~2725), so consolidate_dispatch with provenance reads the STALE first-dispatch metadata (old head_sha/plan/mode) from disk and fails closed with "artifact commit must equal the immutable reviewed head SHA" plus "run X has no included plan entry", even though the run store holds the correct second-dispatch runs. Hit during /uf.unleash on opsx/fix-triage-issue-dispatch-docs when the code-review dispatch followed the spec-review dispatch. Recovery: back up the prior finalization artifact, rewrite session-metadata.json in the $TMPDIR dispatch session dir with the byte-identical metadata the second dispatch passed (and the plugin dropped), re-call consolidate_dispatch with the same provenance — validation then passes and the finalizer assigns a fresh correlation to the new artifact. Until #760 is fixed, any two-dispatch opencode session needs this recovery.
