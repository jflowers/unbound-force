---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-22T12:17:14Z
identity: review-dispatch-20261022T121714-jay-flowers
tier: draft
---

capture_review_diff (unbound-force review-dispatch plugin) diffs tracked modifications repo-wide but gathers untracked and git-ignored files only from under the feature_dir parameter (review-diff.ts uses featureDir-scoped "git ls-files --others [--ignored] --exclude-standard"). New files created outside the feature dir — e.g. a shared lib module under .opencode/lib/, its tests under .opencode/test/, or scaffold mirrors under internal/scaffold/assets/ — are silently excluded from review diffs in uncommitted-local mode (the standard sequential /uf.unleash posture; the worktree/parallel path commits before review and is unaffected). Symptom: pre-flight is green (tests import the files) while the review diff lacks them, so the council reviews registrations and consumers of invisible code. Before dispatching a council on an uncommitted tree, cross-check files referenced by changed lines (imports, asset pins) against the changed-file list, and explicitly `git add` new files outside the feature dir so they enter the tracked diff.
