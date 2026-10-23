---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-23T14:56:45Z
identity: review-dispatch-20261023T145645-jay-flowers
tier: draft
---

A module-level Map keyed by conversation/session ID binds its value for the entire process lifetime and silently couples every workflow that shares the conversation. In the review-dispatch plugin this coupled distinct dispatch workflows to one correlation ID (unbound-force#794, symptoms #760/#746): the second workflow's replace-with-latest persistence clobbered the first's dispatch session, and finalization engaged the artifact collision retry, publishing under a correlation that no longer matched its session. The fix pattern (per-invocation identity with latest-wins resolution): (1) mint the identity per invocation — the unit of work — immediately after input validation, before any fallible step; (2) re-point the conversation map at mint time so auto-resolution always means "the work I just started"; (3) keep explicit-ID resolution on read-side tools so earlier sessions stay retrievable as audit trail; (4) let session-less invocations (all-skip, pre-dispatch failure) re-point the map to a nonexistent session so later retrieval fails closed as not_found instead of returning the previous workflow's payload — stale-payload retrieval is the dangerous failure mode, not the not_found; (5) read the invocation-local identity (not a map re-read) in post-work collection steps so concurrent invocations from the same conversation cannot cross-contaminate. Guard for future work: do NOT apply per-invocation minting to single-run execution layers that legitimate multi-call fan-out relies on — per-conversation binding is correct there, and shattering fan-out into N sessions breaks plan validation at consolidation.
