---
tag: scaffold
author: jay-flowers
category: pattern
created_at: 2026-08-14T21:32:48Z
identity: scaffold-20260814T213248-jay-flowers
tier: draft
---

When adding protection for specific files in the scaffold engine's --force overwrite path, the isNeverOverwrite predicate must be kept separate from isToolOwned because they represent orthogonal properties. isToolOwned answers "should this file be auto-updated on content diff?" while isNeverOverwrite answers "should this file survive --force?" The constitution is user-owned AND never-overwritable — conflating these into isToolOwned would invert its semantics. The guard clause must be placed BEFORE the opts.Force block (not inside it) to intercept all overwrite paths. When adding such guards, also check TestRun_ForceOverwrites which counts overwritten files against expectedAssetPaths — the count must be adjusted by subtracting the number of never-overwrite files, otherwise the test will fail with a count mismatch.
