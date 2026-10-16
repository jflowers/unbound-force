---
tag: artifact-contracts
author: jay-flowers
category: pattern
created_at: 2026-10-15T12:31:00Z
identity: artifact-contracts-20261015T123100-jay-flowers
tier: draft
---

When a change finally writes an artifact that a consumer has long read, derive the field set from the consumer's documented contract — the consumer's merged spec requirements and its command field references — not from the producer's convenient outputs. Path-level compatibility (same file path, JSON-parseable) is not shape-level compatibility. Seen in openspec/changes/unleash-deterministic-tools (issue #716 defect 1): D7 specified {change name, tier, feature dir, review verdicts, iteration counts, learnings, timestamp} while the merged /uf.finale consumer reads unleashSummary.{whatWasBuilt, howToVerify, testResults} per finale-token-reduction's spec — the artifact would be non-null yet unusable, and the defect only nominally closed. Reviewer check: for any "finally write the artifact X already reads" claim, grep the consumer for every field reference and diff it against the proposed field set before freezing the spec.
