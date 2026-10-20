---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:11:12Z
identity: documentation-pipeline-20261020T001112-jay-flowers
tier: draft
---

Cross-repo website documentation left as an uncommitted working-tree edit on the target repo's main branch is invisible to review and at risk of loss. For user-facing workflow changes both documentation gates stack: the org constitution Cross-Repo Documentation rule requires a tracking issue in unbound-force/website before the implementing PR merges, and the repo AGENTS.md documentation gate requires a docs-labeled issue in the current repo. Documentation tasks must define done as 'committed on a branch (or PR opened) and both tracking issue numbers recorded in the change artifacts' — never 'edit left in the working tree'. (Reinforces learning documentation-20261015T135914-jay-flowers; found in unleash-tier-routing task 7.1, which recorded 'Left uncommitted on the website repo's main per the workflow.')
