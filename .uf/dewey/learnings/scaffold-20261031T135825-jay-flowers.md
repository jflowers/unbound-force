---
tag: scaffold
author: jay-flowers
category: gotcha
created_at: 2026-10-31T13:58:25Z
identity: scaffold-20261031T135825-jay-flowers
tier: draft
---

When a runtime tool's remediation message directs users to edit a scaffolded file, the scaffold's ownership classification MUST treat that file as user/project-owned — otherwise the next plain `uf init` re-run silently reverts the remediation-directed edit (tool-owned = overwrite-on-diff). unbound-force issue #884: the review-dispatch plugin's fail-closed remediation told users to add entries to `.uf/reviewer-capabilities.yaml` while `isToolOwned` classified the file tool-owned, making custom Divisor reviewer registrations half-persistent. Cross-check every runtime-directed edit surface against the scaffold ownership table before shipping a remediation message; the matrix file already models the correct pattern ('project-owned extension point' comment).
