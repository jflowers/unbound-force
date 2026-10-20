---
tag: spec-authoring
author: jay-flowers
category: pattern
created_at: 2026-10-19T22:36:01Z
identity: spec-authoring-20261019T223601-jay-flowers
tier: draft
---

Standing spec requirements MUST NOT pin mutable artifact values as eternal assertions (e.g., "the pack frontmatter version MUST be 1.1.0") when a coordinated in-flight change is documented to bump them next — the requirement is falsified the moment the next change lands, forcing a spec amendment. Phrase version changes as change-scoped bump directives ("this change MUST bump the pack version 1.0.0 → 1.1.0") or floors ("MUST be at least 1.1.0"), and keep exact-value checks inside the change's own verification scenario rather than the standing requirement text. Precedent: determinism-codification used transitional bump phrasing ("Version 1.3.1 -> 1.4.0"); the seam-verification spec delta instead pinned "MUST be 1.1.0" as standing state while simultaneously documenting that #758 would land later with its own version bump.
