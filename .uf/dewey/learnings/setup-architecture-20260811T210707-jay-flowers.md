---
tag: setup-architecture
author: jay-flowers
category: pattern
created_at: 2026-08-11T21:07:07Z
identity: setup-architecture-20260811T210707-jay-flowers
tier: draft
---

buildSteps() in internal/setup/setup.go defines the step execution order for uf setup. When adding a new DI field that depends on another tool (e.g., ResolveRelease depends on gh CLI), verify the step ordering ensures the dependency is installed first. Issue #455 revealed that Gaze was installed before GitHub CLI — the fix reordered buildSteps() so installGH runs before installGaze. A test (TestBuildSteps_GHBeforeGaze) now locks this ordering invariant.
