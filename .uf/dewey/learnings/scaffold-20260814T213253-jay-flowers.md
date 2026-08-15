---
tag: scaffold
author: jay-flowers
category: gotcha
created_at: 2026-08-14T21:32:53Z
identity: scaffold-20260814T213253-jay-flowers
tier: draft
---

The scaffold engine's TestRun_ForceOverwrites test at scaffold_test.go compares len(result.Overwritten) against len(expectedAssetPaths). When introducing file protection via isNeverOverwrite, protected files are moved from Overwritten to Skipped during --force runs. The test must be updated to dynamically compute wantOverwritten by iterating expectedAssetPaths and subtracting files where isNeverOverwrite returns true. This approach is future-proof — if more protected files are added, the test automatically adapts. The existing TestRun_SkipsExisting test was not affected because the constitution was already being skipped as a user-owned file on non-force re-runs, and the isNeverOverwrite guard produces the same result (skip) for the non-force path.
