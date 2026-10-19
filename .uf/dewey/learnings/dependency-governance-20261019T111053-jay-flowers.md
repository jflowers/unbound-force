---
tag: dependency-governance
author: jay-flowers
category: pattern
created_at: 2026-10-19T11:10:53Z
identity: dependency-governance-20261019T111053-jay-flowers
tier: draft
---

When a spec change bundles a dependency version bump that the artifacts honestly declare as maintainer-directed (gatekeeping exception unsatisfied), the Adversary should: (1) verify the transitive dependency surface is fully enumerated in the design, (2) check that rollback is documented, (3) confirm all pin-enforcement gates (drift tests, exact-version assertions, baseline SHA, AGENTS.md Technology Stack) are moved to the new pin by tasks, (4) flag the unsatisfied exception as HIGH (not CRITICAL — the honest declaration and gate enforcement distinguish it from a silent gate bypass), and (5) note that the council verdict is the remaining gate. This pattern — transparent declaration + maintained gates + council judgment — is the correct escalation path when a maintainer overrides a gatekeeping rule.
