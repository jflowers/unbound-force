---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-31T13:58:23Z
identity: openspec-20261031T135823-jay-flowers
tier: draft
---

In unbound-force's OpenSpec convention, a change's proposal.md Capabilities ledger must name exactly the capabilities carried by its delta specs (specs/<capability>/spec.md). A 'Modified Capabilities' entry is only valid when a baseline capability of that name already exists in openspec/specs/ AND a delta in the change targets it; when the baseline does not cover the area, the correct ledger is a single New capability whose name matches the delta directory, with Modified declared as none (precedent: persist-unleash-summary's 'the baseline specs do not yet cover...' wording). Verified 2026-10-31 reviewing reviewer-capabilities-init-survival, whose ledger declared New 'reviewer-registration-durability' + Modified 'file-ownership-model' against a single 'scaffold-ownership' delta with no matching baseline — the mismatch survives silently because no tooling validates the ledger against the delta.
