---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-19T18:23:48Z
identity: documentation-pipeline-20261019T182348-jay-flowers
tier: draft
---

When reviewing a change that corrects shared-tool documentation across command files, grep the tool name across all command files and triage every hit into three buckets: (1) embedded prose copies of the corrected claims — these need the same correction in the change; (2) normative references citing a corrected command's protocol sections — these inherit the fix automatically and need no edit; (3) bare call instructions that make no output claims — no action needed. Verified in code review of fix-triage-issue-dispatch-docs: uf.unleash.md needed no correction because it cites /uf.review-council's protocol sections as normative reference (its only consolidate_dispatch mentions carry the correct exactly-once-per-finalization bound, and it has zero proposals-consumption prose), while speckit-testreview required a tracked follow-up (#756). The three-bucket triage turned 100+ dispatch_review_runs references across the command, mirror, and spec surfaces into a two-minute verification instead of a full re-audit.
