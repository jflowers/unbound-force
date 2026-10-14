---
tag: ci-parity
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:31:37Z
identity: ci-parity-20261014T123137-jay-flowers
tier: draft
---

make lint in unbound-force repos is go vet + golangci-lint — Go-only; it does not lint markdown. New markdown governance files (convention packs, skills, constitution amendments, spec artifacts) are linted only by MegaLinter in ci_checks.yml; there is no local markdown-lint make target. CI-parity task rationales claiming 'lint covers the new markdown files' misstate local coverage — a markdownlint violation surfaces only after PR. Markdown-heavy changes should either run mega-linter-runner locally (requires Docker) or explicitly accept CI-only markdown linting in the task rationale. AGENTS.md's CI parity rule says to derive commands from .github/workflows — the make targets alone under-represent what CI actually checks.
