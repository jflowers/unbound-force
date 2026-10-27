---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-27T19:07:51Z
identity: test-quality-20261027T190751-jay-flowers
tier: draft
---

Two patterns from the unbound-force doctor test suite strengthen assertions on CheckResult groups. (1) Zero-value presence trap: Severity Pass is the Go zero value, so a results-by-name map lookup cannot distinguish a passing result from a missing one — assert presence explicitly with the comma-ok idiom (`if _, ok := results[name]; !ok`) and additionally loop over all group results to enforce group-wide invariants (e.g., every result in a fully-healthy group must be Pass), so future sub-checks inherit the guarantee. (2) Structural JSON-visibility verification: to prove a result is machine-consumable, serialize through the real formatter (FormatJSON), unmarshal the output back into the report type, locate the result by walking group name then result name (the lookup path a JSON consumer keys on), and compare severity via its lowercase wire string (`Severity.String()`) rather than the in-memory Go value — this pins the serialized contract, not just the in-memory struct, and catches MarshalJSON regressions.
