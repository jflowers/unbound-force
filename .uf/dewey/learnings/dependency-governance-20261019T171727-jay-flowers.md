---
tag: dependency-governance
author: jay-flowers
category: pattern
created_at: 2026-10-19T17:17:27Z
identity: dependency-governance-20261019T171727-jay-flowers
tier: draft
---

When a dependency bump raises the runtime engine floor via a transitive package (opsx/clarification-marker-superset: @opencode-ai/plugin 1.19.0 pulling ini@7.0.0, which requires Node ^22.22.2 || ^24.15.0 || >=26.0.0), documenting the floor in AGENTS.md and verifying the CI node pin satisfies it is necessary but not sufficient. npm surfaces engines violations as warnings naming the deep transitive package (ini@7.0.0), not the repository's own requirement, so contributors below the floor get an unactionable signal with no pointer to the documented floor. Declare the constraint at the manifest level — an `engines` field in the plugin-suite package.json, mirrored to the scaffold assets so `uf init` consumers inherit it — so the floor is top-level, actionable at install time, and mechanically synced with the pin that raises it. Documentation-only floors defer discovery to the moment of least leverage: a contributor mid-install who cannot tell whether the warning matters.
