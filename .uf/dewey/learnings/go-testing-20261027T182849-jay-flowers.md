---
tag: go-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-27T18:28:49Z
identity: go-testing-20261027T182849-jay-flowers
tier: draft
---

In the unbound-force doctor package, Severity "Pass" is the Go zero value, so a table-driven test that looks up results in a map[string]CheckResult and asserts `results[name].Severity != Pass` passes vacuously when the named result is missing entirely — the zero-value lookup also reads as Pass. Tests that assert a passing sub-check must first assert presence explicitly (`if _, ok := results[name]; !ok { t.Errorf(...) }`) before reading Severity, or iterate group.Results asserting every expected name exists. TestCheckReplicator_AllPass in internal/doctor/doctor_test.go demonstrates the correct pattern: presence loop over expected result names, plus an all-results-Pass loop so any future sub-check inherits the guarantee.
