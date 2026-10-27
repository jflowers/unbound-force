---
tag: go-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-27T19:07:32Z
identity: go-testing-20261027T190732-jay-flowers
tier: draft
---

In the uf doctor Go test suite, Severity's Pass is the zero value, so results[name].Severity == Pass evaluates true for a MISSING map entry as well as a passing one. Tests that collect CheckGroup results into map[string]CheckResult must assert key presence (comma-ok or explicit name loop) before comparing severity. TestCheckReplicator_AllPass (internal/doctor/doctor_test.go) documents this in-line and asserts presence for each expected sub-check name ("replicator", "replicator version", ".uf/replicator/", "MCP config") before any severity comparison. Without the presence assertion, a sub-check that silently stops being emitted still passes its severity check — a regression can hide behind a green test.
