---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-22T21:20:18Z
identity: plugin-architecture-20261022T212018-jay-flowers
tier: draft
---

Duplicated state-path construction between a writer and a reader component is a silent-drift operational risk. In unbound-force, the uf-workflow plugin writes `.uf/progress/<sanitized-branch>/uf.unleash.json` while uf-finale independently reconstructs the same path and re-implements the completed_steps/positive-integer guards; a path or format change on one side breaks the cross-plugin state handoff without failing at the change site. Test-pinning the writer-reader pair catches drift in CI (issue #707 precedent), but extracting the path construction and guards into one shared lib consumed by both sides removes the drift surface structurally rather than just detecting it. When such an extraction touches scaffold mirrors, the live and mirrored copies must remain byte-identical and drift tests must verify that identity within the same increment.
