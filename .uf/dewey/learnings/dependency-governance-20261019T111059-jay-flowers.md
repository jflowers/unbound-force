---
tag: dependency-governance
author: jay-flowers
category: gotcha
created_at: 2026-10-19T11:10:59Z
identity: dependency-governance-20261019T111059-jay-flowers
tier: draft
---

When a spec change declares a dependency-update scope for a governance-protected pin, verify the declared enumeration against the actual lockfile diff before treating the declaration as complete. In the clarification-marker-superset iteration-2 review (2026-10-19), design D7's scope list named only ini/msgpackr/effect while the package-lock diff also introduced two new transitive packages (@ai-sdk/provider 3.0.8 — a new direct dependency of @opencode-ai/plugin 1.19.0 — and json-schema 0.4.0) and refreshed five more (@opencode-ai/sdk, fast-check, msgpackr-extract, multipasta, pure-rand, yaml); the proposal's "transitive changes are enumerated in D7" and "changes no dependency surface" claims were therefore false as written. Enumeration claims in constitution-alignment and declaration sections must be derived from `git diff <lockfile>` — new-package arrivals, not just the visible major-version bumps, are the material supply-chain delta.
