---
tag: opsx-replicator-version-floor
author: jay-flowers
category: pattern
created_at: 2026-10-27T19:08:41Z
identity: opsx-replicator-version-floor-20261027T190841-jay-flowers
tier: draft
---

Docs-gate issues in the unbound-force repo follow the "Documentation impact — <change-name>" pattern with per-surface dispositions (one disposition line per docs surface: docs/cli-reference.md, docs/usage.md, docs/architecture.md, README.md, AGENTS.md, content coverage thresholds, website target); `documentation` is the gate-issue label; docs/cli-reference.md is the primary user-facing surface for CLI output changes while usage.md carries one-liners only; always dedupe-scan open issues first before filing (~40 open docs issues at any time — scan by keyword via `gh issue list --state open` + search). On the website repo (unbound-force/website) the label set differs (blog/docs/tutorial/release-ready/next-release/llm_assisted — no `documentation` label), so file website tracking issues without the label rather than creating one. Observed on opsx/replicator-version-floor (2026-10-27): repo-local gate issue unbound-force/unbound-force#844 and website tracking issue unbound-force/website#337, both following the pattern; the constitution's Cross-Repo Documentation gate requires the website issue to exist before the implementing PR merges for user-facing changes.
