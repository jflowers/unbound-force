---
tag: dependency-management
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:15:21Z
identity: dependency-management-20261019T211521-jay-flowers
tier: draft
---

npm `engines` fields accept full OR-ranges. When the binding runtime constraint is a transitive dependency's disjunctive engines range (ini 7.0.0: `^22.22.2 || ^24.15.0 || >=26.0.0`), declare that range verbatim in the manifest and its scaffold mirror rather than approximating it with a single-value floor. A `>=min` floor is a strict superset: `>=22.22.2` silently admits Node 23.x, 25.x, and 24.0–24.14.x, which the transitive rejects — turning the enforcement field into a false-compatibility signal that every scaffold consumer (uf init) inherits. The lockfile and node_modules record each transitive's engines range, so the verbatim value is verifiable locally without network access. Observed in feedback review of PR 761 (fix-triage-issue-dispatch-docs): the PR's own AGENTS.md edit claimed the disjunctive range was "declared in the engines field" while the field held `>=22.22.2`. Extends dependency-management-20261019T182352 (circular single-value verification) with the superset-floor failure mode and the verbatim-range remedy.
