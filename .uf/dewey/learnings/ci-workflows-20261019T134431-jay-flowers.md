---
tag: ci-workflows
author: jay-flowers
category: pattern
created_at: 2026-10-19T13:44:31Z
identity: ci-workflows-20261019T134431-jay-flowers
tier: draft
---

When consuming a cross-repo reusable GitHub Actions workflow whose release tag does not exist yet, pin by the verified merge SHA and record verification evidence in the change's design doc (upstream PR number plus the first post-merge run ID that exercised the full path); defer the CI-003 version comment until the first release tag ships, then add the tag as a trailing comment without moving the SHA. Also plan a post-merge verification task for the first run on the target branch, because skip-on-missing-secret reusable workflows can leave a newly added CI gate silently inert when an org secret is not scoped to the consuming repo. Verified in unbound-force PR #752 consuming unbound-force/gaze reusable_gaze_ai_report.yml@c133b1180f26bf0b2ae433d22f6c7adf9fbff992 (gaze PR #300, dogfood run 39239267809).
