---
tag: spec-review
author: jay-flowers
category: pattern
created_at: 2026-10-31T13:58:30Z
identity: spec-review-20261031T135830-jay-flowers
tier: draft
---

Spec artifacts that cite exact line numbers and quote requirement text verbatim can be machine-verified at review time, making Guard intent-drift review cheap and high-confidence. The reviewer-capabilities-init-survival OpenSpec change cited scaffold.go:672-674 (tool-owned branch), scaffold.go:675-679 (project-owned matrix branch), scaffold_test.go:2800 (ownership table entry with exact comment text), scaffold_test.go:2312/1933-1974/3457-3458 (test references), index.ts:1897 (plugin remediation message, with MANIFEST_PATH confirmed at line 100), and Spec 005 FR-023 — every citation verified accurate against HEAD, and the embedded/deployed reviewer-capabilities.yaml byte-identity was confirmed via matching file hashes. Recommend exact line citations plus verbatim quotes as the standard for ownership/behavior-change proposals so reviewers verify rather than trust.
