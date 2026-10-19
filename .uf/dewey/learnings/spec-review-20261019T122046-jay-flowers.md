---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-19T12:20:46Z
identity: spec-review-20261019T122046-jay-flowers
tier: draft
---

Spec-review remediation gotcha: when an enumerated list is corrected in one artifact, the count adjectives restating that list in other artifacts survive unfixed. In the clarification-marker-superset change, iteration-2 remediation corrected design D7's transitive-package enumeration to nine packages, but the proposal's What Changes and Constitution Impact sections still said "ten" — a figure reachable only by counting the direct dependency the same sentences list separately. Reviewers reconcile enumerated lists against sources but tend to trust summary counts. When correcting any enumeration across a change's artifacts, grep every restating surface for the old figure and its count adjectives; re-derive the count in each surface, or delete the adjective and let the list speak.
