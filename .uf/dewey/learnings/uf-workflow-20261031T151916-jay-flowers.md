---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-31T15:19:16Z
identity: uf-workflow-20261031T151916-jay-flowers
tier: draft
---

defaultGitExec (.opencode/lib/uf-workflow-types.ts:64-68) applies .trim() to ALL git command output. Porcelain v1 status lines for worktree-modified files begin with a space (" M path"); trim eats that leading space, so porcelainEntryPath's slice(3) (which assumes the "XY path" 2-status-chars-plus-space prefix) cuts one byte into the path ("penspec/...") — the result never equals the excluded tasks.md path, so specArtifactsDirty (uf-workflow index.ts:2635-2643) returns true for ANY worktree-modified file in the feature dir, including pure tasks.md checkbox edits the exclusion is designed to allow. Under this bug the only dirty-check-passing feature-dir states are an empty porcelain or staged/committed tasks.md-only changes ("M  path" survives trim). Symptom: uf_unleash_detect_resume derives spec_review false and every /uf.unleash re-delegation re-runs the ~15-min spec review despite an approving current-branch artifact with matching head SHA. Production-only: unit-test fakes (unleash-resume.test.ts:300, uf-finale.test.ts, sibling-evidence.test.ts) return porcelain fixtures verbatim without trim, so the exclusion tests stay green while production corrupts; golden-output-shape.test.ts:794-797 documents prior awareness of the trim interaction. Found during issue #884 orchestration (2026-10-31): round-2 detection TRUE (clean feature dir, empty status early-return), round-3 detection FALSE (tasks.md checkbox flips). Fix (defaultGitExec must not trim porcelain output, or porcelainEntryPath must tolerate the corrupted prefix) requires its own spec workflow — phase-boundaries rule.
