---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-22T13:00:06Z
identity: review-dispatch-20261022T130006-jay-flowers
tier: draft
---

capture_review_diff's uncommitted-local mode only assembles untracked files under the feature dir; new source files placed elsewhere (e.g. .opencode/lib/) stay invisible to the review diff because `git diff <base>` shows tracked files only. Explicitly `git add` new source files before dispatching review-council — staged-but-uncommitted new files become tracked and appear in `git diff <base_sha>`. Evidence: the unleash-pipeline-hardening change's shared review-diff.ts module, its 408-line test suite, and the scaffold mirror were all absent from the iteration-2 diff, forcing out-of-band working-tree verification of tasks 3.1/3.2/3.4.
