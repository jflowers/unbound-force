---
tag: documentation
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:49:57Z
identity: documentation-20261022T224957-jay-flowers
tier: draft
---

When a change replaces or renames workflow-gate options or exit strings, stale-reference greps must cover the policy's conceptual phrasings, not only the exact old labels. In unbound-force (change spec-review-per-finding-gate, reviewed 2026-10-22), task 3.2 grepped the exact old option labels ('Skip auto-fixes -- report only', 'Review findings first') and gate name ('spec auto-fix consent gate') and found them clean in commands/skills/docs — but docs/heroes.md:117 summarized the same policy in different words ('Hybrid fix policy (auto-fix LOW/MEDIUM, report HIGH/CRITICAL)') and survived the grep stale. Remedy: also grep the policy concepts (severity-tier phrases like 'report HIGH/CRITICAL', 'auto-fix LOW/MEDIUM', mode names like 'spec review') across user-facing docs, and grep the NEW option labels to enumerate every file that describes the workflow. Legitimate old-label hits remain in point-in-time records (openspec/changes/*, specs/, historical CHANGELOG entries) and stale-absence tests; only live hits in commands/, skills/, and docs/ are gaps.
