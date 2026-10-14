---
tag: regression-testing
author: jay-flowers
category: pattern
created_at: 2026-10-14T17:11:10Z
identity: regression-testing-20261014T171110-jay-flowers
tier: draft
---

For bug-fix changes whose fix is the deletion of an offending behavior (e.g., removing console.log calls from plugin tool handlers), a one-time verification grep provides no regression protection: nothing in CI fails if the behavior is reintroduced, even though the entire change exists to eliminate it. The regression test for a deletion-fix is a negative assertion: spy on the offending API (vi.spyOn(console, "log"/"error")) around the existing per-handler unit tests that already invoke each handler with mock dependencies, and assert zero calls. Such a test fails on pre-fix code and passes after, satisfying TC-006 ("bug fixes MUST include a regression test that fails without the fix"), and gives the spec's MUST NOT requirement the same automated enforcement that additive requirements get from value assertions.
