---
tag: dependency-management
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:15:18Z
identity: dependency-management-20261019T211518-jay-flowers
tier: draft
---

When review feedback corrects a declared value inside a lockstep set (e.g., a dependency-derived Node engines floor), enumerate every surface that repeats the value before fixing: canonical manifest, scaffold mirror, README, AGENTS.md, CHANGELOG entry, the in-flight spec delta's requirement text (FR/proposal/design/tasks), and any concurrently proposed value-pinning test — then land them in one lockstep commit staged by explicit path. Observed on PR 761 (fix-triage-issue-dispatch-docs, feedback item 6): engines.node ">=22.22.2" was a superset of ini 7's binding "^22.22.2 || ^24.15.0 || >=26.0.0", and the approximation appeared on five-plus surfaces while the same PR's AGENTS.md edit simultaneously claimed the full range was what the field declared — three different values for one constraint inside one change. Detection recipe: grep the repo for the value string (here "22.22.2"), then diff every hit against the authoritative source (the lockfile's recorded engines for the binding transitive, package-lock.json "node_modules/ini" entry) and against every other hit. General rule: a docs-accuracy change must hold its own adopted scope additions to the same factual-fidelity standard it applies to the artifacts it corrects, and a value correction must be coordinated with any feedback item that pins that value in a test, landing value + assertion atomically.
