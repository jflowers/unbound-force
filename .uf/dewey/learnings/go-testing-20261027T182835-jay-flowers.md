---
tag: go-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-27T18:28:35Z
identity: go-testing-20261027T182835-jay-flowers
tier: draft
---

In Go table tests that collect results into a map keyed by result name, a zero-valued enum makes a plain lookup indistinguishable from absence. In unbound-force's internal/doctor, Severity's zero value is Pass, so `results["replicator version"].Severity != Pass` fails correctly for a Warn result but `results["x"].Severity == Pass` passes even when "x" was never emitted — a sub-check that silently stops appending its result would keep the test green. When asserting a zero-value outcome (Pass, 0, "", false, nil), first assert presence explicitly: `if _, ok := results[name]; !ok { t.Errorf("%s result not found", name) }`. The replicator-version-floor tests (TestCheckReplicator_AllPass, TestCheckReplicator_VersionFloor) demonstrate the pattern with an explanatory comment; future doctor sub-check tests should inherit it.
