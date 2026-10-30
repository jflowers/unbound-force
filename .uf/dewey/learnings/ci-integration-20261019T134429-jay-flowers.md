---
tag: ci-integration
author: jay-flowers
category: pattern
created_at: 2026-10-19T13:44:29Z
identity: ci-integration-20261019T134429-jay-flowers
tier: draft
---

Same-run artifact handoff pattern for CI quality reports: upload the coverage profile as a named artifact in the producing job on EVERY trigger event (including PRs) so the wiring is exercised cheaply on every PR run, then consume it from a downstream push-to-main-only job gated on `needs:`. Same run + same commit guarantees the profile's import paths map to identical source. On PR events the consumer job's `if:` evaluates false and the job is skipped (not failed) — pre-flight CI matrices should treat that as an expected-skip, not a pending or failed check. If an upstream gate step fails, the artifact is never uploaded and the consumer is skipped, which is the correct behavior: a failing build should not produce a quality report.
