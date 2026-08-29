---
tag: add-todowrite-to-pipelines
author: jay-flowers
category: context
created_at: 2026-08-29T19:31:07Z
identity: add-todowrite-to-pipelines-20260829T193107-jay-flowers
tier: draft
---

The spec review council for add-todowrite-to-pipelines identified a critical gap: all 6 reviewers (including Tester, SRE, Architect) independently flagged that tasks modifying .opencode/commands/ files must also update the scaffold copies at internal/scaffold/assets/opencode/commands/. The TestEmbeddedAssets_MatchSource drift detection test enforces byte-identity between these pairs. This is the most frequently flagged issue in spec reviews for command template changes — it was caught by the Tester (HIGH finding that triggered REQUEST CHANGES), SRE (MEDIUM), Architect (LOW), Guard (MEDIUM), and Curator (LOW). The auto-fix added explicit scaffold copy tasks (task 2.2) and instructions to the task group header. This pattern is so universal that future spec proposals modifying .opencode/commands/ files should proactively include scaffold sync tasks from the start.
