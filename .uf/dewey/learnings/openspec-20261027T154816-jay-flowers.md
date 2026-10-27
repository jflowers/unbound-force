---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-27T15:48:16Z
identity: openspec-20261027T154816-jay-flowers
tier: draft
---

In unbound-force OpenSpec changes, the proposal's Capabilities section (New/Modified/Removed) must name the same capabilities as the delta spec directories under changes/<name>/specs/<capability>/spec.md. Recent precedents all match one-to-one: delegation-skill-enforcement declares unleash + determinism-policy with delta dirs specs/unleash/ and specs/determinism-policy/; ts-plugin-coverage-gate declares ci with specs/ci/; unleash-tier-routing declares unleash with specs/unleash/. Older changes (fix-doctor-hints, dewey-init-ownership) used flat specs/<topic>.md files, but the nested capability-dir convention is current. A delta dir whose name matches no proposal declaration (or a declaration with no delta dir) breaks the change's bill of materials and traceability. Review check: enumerate specs/*/ under the change dir and diff against the declared capability names; also check whether a Modified declaration corresponds to an existing capability in openspec/specs/ (only ci, graphthulhu-distribution, review-council existed as of 2026-10).
