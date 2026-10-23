---
tag: content-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-23T14:56:32Z
identity: content-pipeline-20261023T145632-jay-flowers
tier: draft
---

The unbound-force documentation gate for user-facing changes has two issue halves that tasks.md planning can silently collapse into one: (1) the in-repo docs issue (label docs) required by the repo AGENTS.md documentation gate, and (2) the unbound-force/website issue required by the org constitution's Cross-Repo Documentation rule before the implementing PR merges. fix-review-dispatch-correlation-release task 5.5 named only the in-repo issue, and the website half was missed entirely (caught at review council: in-repo #808 was filed, but no website issue existed for the change; fixed by filing unbound-force/website#319). Established precedent pairs both halves: in-repo #740 + website#310 (fix-tool-args-schema-mismatch), in-repo #710 + website#306 (fix-tui-git-output-leak), website#313 (#751 recovery tools), website#316 (#764 verdict derivation), website#317 + in-repo #791 (delegation classification). When authoring or reviewing tasks.md documentation-gate tasks for user-facing changes, enumerate BOTH repositories explicitly in the task text, and verify at review time that both exist: gh issue list --repo unbound-force/website --state all --search "<change keyword>" (search the in-repo label-docs list for the other half).
