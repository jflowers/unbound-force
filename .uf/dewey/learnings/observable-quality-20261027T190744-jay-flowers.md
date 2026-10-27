---
tag: observable-quality
author: jay-flowers
category: pattern
created_at: 2026-10-27T19:07:44Z
identity: observable-quality-20261027T190744-jay-flowers
tier: draft
---

When a spec requires a governing value (version floor, threshold, limit) to be visible to machine consumers of structured output, serialize it in a dedicated field on every outcome class — pass, below-threshold, and fail-open — not only in the failure-path message. Message-only placement leaves the value invisible on pass (the message carries just the detected value) and on fail-open (the message carries neither), which is precisely when consumers need to key on it. In the replicator-version-floor change (unbound-force), round-1 review flagged this as intent drift against the spec's "detected version, applicable floor, and severity visible to machine consumers" requirement; the round-2 fix added "version floor: v0.7.0" to CheckResult.Detail on all three outcome classes and extended the JSON round-trip test to assert Detail per outcome class, closing the gap. Spec writers should name the carrier field per outcome when machine visibility of a governing value is required.
