---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-26T15:32:01Z
identity: spec-authoring-20261026T153201-jay-flowers
tier: draft
---

When spec artifacts enumerate tool-rendered values (exit variants, zod enums, status codes), verify the enumeration against the tool's implementation, not memory. In the update-run-pipeline-plan spec review, the artifacts claimed format_unleash_exit renders "eight" exit variants while the uf-workflow plugin ships eleven (tier-routing-dirty-tree, tier-routing-missing-tooling, and planner-failure were omitted). Heading-keyed recognition in the consuming command tolerates a stale list, but task text that transcribes the enumeration into command documentation propagates the error into shipped docs. Before asserting counts or lists of tool-rendered values in spec artifacts, grep the tool source (e.g. the variant enum fed to format_unleash_exit in .opencode/plugins/uf-workflow/index.ts) and record what was verified.
