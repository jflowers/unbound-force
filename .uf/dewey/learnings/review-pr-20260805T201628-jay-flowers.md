---
tag: review-pr
author: jay-flowers
category: gotcha
created_at: 2026-08-05T20:16:28Z
identity: review-pr-20260805T201628-jay-flowers
tier: draft
---

The Guard reviewer correctly identified that uf.review-pr.md has a scaffold copy at internal/scaffold/assets/opencode/commands/uf.review-pr.md that must be kept in sync with the canonical .opencode/commands/uf.review-pr.md file. During the fix-review-pr-step7-gate change, I incorrectly dismissed this finding because I searched for the file using the wrong path. The TestEmbeddedAssets_MatchSource drift detection test in internal/scaffold/scaffold_test.go caught the desync in CI. Lesson: when modifying any file under .opencode/commands/, always check if a scaffold copy exists at the corresponding path under internal/scaffold/assets/ and update both files together.
