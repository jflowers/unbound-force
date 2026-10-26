---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-26T17:23:08Z
identity: content-pipeline-20261026T172308-jay-flowers
tier: draft
---

When a tasks.md doc-gate task schedules `gh issue create`, the filing procedure must be inlined, not left to implementer discretion. Verified on update-run-pipeline-plan task 3.3 (2026-10-26, spec review iteration 2): the task named both required issues (in-repo + website) but omitted the duplicate search, `--label "docs"`, the in-repo issue title, and body content. The live duplicate check surfaced open unlabeled issue #747 ("Docs gate: command-prose-pilot rewrite of /uf.run-pipeline-plan") — the prior change's docs-gate issue for the same command file, whose recorded assessment ("behavioral contract preserved; website exempt") the new change overturns, and whose comment tracks pending AGENTS.md follow-up work. Two compounding traps: (1) label-filtered duplicate searches miss unlabeled docs issues — #747 appears only in the unfiltered keyword search while `--label docs` returns only #728 — so the scheduled search must run unfiltered by keyword; (2) each change filing its own docs issue for the same file accumulates open issues carrying stale, contradictory assessments unless the new issue explicitly references and supersedes (or closes with rationale) the prior one. Recipe for tasks that schedule issue filings: inline (a) the unfiltered open-issue keyword search command, (b) a disposition clause for any related open issue, (c) the full gh command including --label and --title, and (d) the body content enumerating user-visible changes; the prior change's docs-gate issue body is the structural template.
