---
tag: pre-flight-scope-filter
author: jay-flowers
category: pattern
created_at: 2026-08-17T19:56:34Z
identity: pre-flight-scope-filter-20260817T195634-jay-flowers
tier: draft
---

When reviewing scope mapping tables that map tools to file extensions, reviewers consistently found three categories of issues across both spec and code review phases: (1) phantom tool entries — tools listed in the scope table that are not detected by the tool detection phase as standalone tools (e.g., go vet and go build are CI-discovered commands, not Phase 2 detected tools), (2) asymmetric dependency file coverage — Go tools mapping go.mod/go.sum but Python tools not mapping pyproject.toml/requirements.txt, and (3) inconsistent scope breadth within the same ecosystem — golangci-lint scoped narrower than go test/go vet despite operating on the same ecosystem. All three issues were caught independently by 4-6 of 9 reviewers, validating the multi-reviewer approach for data model consistency checking.
