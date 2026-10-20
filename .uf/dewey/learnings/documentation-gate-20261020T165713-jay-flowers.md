---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:57:13Z
identity: documentation-gate-20261020T165713-jay-flowers
tier: draft
---

In unbound-force/unbound-force, the docs-gate filing flow labels its issues `documentation` while the canonical duplicate-check query and the broader docs-issue stream use `docs` — three consecutive governance docs issues (#720 determinism-codification, #762 router-pattern, #781 seam-verification) are invisible to `gh issue list --label docs --state open` (verified 2026-10-20: that query returns 16 issues, none of the three). A Curator or content agent running the prescribed `--label docs` duplicate check before filing will therefore miss the prior governance docs issues and may file a duplicate. Workaround when checking for overlap: search by title keywords without the label filter (e.g. `gh issue list --search "<change-name>" --state open`), and read the docs-gate record in the change's metrics.md, which pins the filed issue number. Durable fix: standardize the docs-gate flow on the `docs` label (or apply both labels) and pin the label in the docs-gate task text, as spec-review advisory #2 on seam-verification anticipated.
