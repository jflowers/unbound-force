---
tag: dependency-pins
author: jay-flowers
category: gotcha
created_at: 2026-10-19T18:23:58Z
identity: dependency-pins-20261019T182358-jay-flowers
tier: draft
---

Adding a declared floor/pin field to .opencode/package.json (e.g. engines.node ">=22.22.2") requires a value assertion in TestPluginPackageInputs_ExactVersionsAndLockIntegrity (internal/scaffold/scaffold_test.go): MirrorsMatchCanonical enforces canonical/mirror byte parity but not the value itself, so changing the floor in BOTH files passes make check. Extend the parsed manifest struct with the engines field and assert the exact value, the same way expectedRuntime/expectedDevelopment/expectedOverrides pin dependency versions.
