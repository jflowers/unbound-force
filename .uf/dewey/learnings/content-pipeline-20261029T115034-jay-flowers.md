---
tag: content-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-29T11:50:34Z
identity: content-pipeline-20261029T115034-jay-flowers
tier: draft
---

Content-pipeline dispositions (blog/tutorial filed vs. declined) for a new command should be cross-checked against the dispositions recorded for sibling commands in the same family during the same window. Observed on opsx/uf-fix-ci (unbound-force repo, October 2026): the change declined the tutorial opportunity with recorded rationale anchored in docs issue #862 ("bounded single-command repair workflow; gates documented in command reference and docs/usage.md"), while the sibling post-PR command /uf.rebase-pr — same command family, disposition recorded one day earlier — carries an open tutorial issue (#855, "recovering a conflicted PR with /uf.rebase-pr"). Per-command assessment in isolation produces family-level asymmetries that read as inconsistency to documentation consumers scanning the post-PR command set. When a decline's rationale would apply equally to a sibling whose opportunity was filed (or vice versa), the disposition should either distinguish the sibling explicitly (e.g., the rebase-pr tutorial covers the git-recovery workflow both commands share, so a fix-ci tutorial would be redundant) or align with it by filing the tracking issue.
