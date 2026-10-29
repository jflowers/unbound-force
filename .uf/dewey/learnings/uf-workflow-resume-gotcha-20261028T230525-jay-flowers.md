---
tag: uf-workflow-resume-gotcha
author: jay-flowers
category: gotcha
created_at: 2026-10-28T23:05:25Z
identity: uf-workflow-resume-gotcha-20261028T230525-jay-flowers
tier: draft
---

uf_unleash_detect_resume falsely reports spec_review: false mid-implementation on opsx/uf-fix-ci (and any branch) when the ONLY spec-dir dirtiness is an uncommitted tasks.md checkbox edit. Root cause: specArtifactsDirty in .opencode/plugins/uf-workflow/index.ts runs `git status --porcelain` through defaultGitExec, whose .trim() strips the leading space of the first porcelain line (" M path" becomes "M path"); porcelainEntryPath's line.slice(3) then misparses the path so it never equals the excluded tasks.md path and the tree reads as dirty. The approving dispatch artifact (.uf/artifacts/dispatch/6dd7da39-*.json, specs mode, APPROVE WITH ADVISORIES, head SHA 13f6e6a6 ancestor of HEAD) is the authoritative record: spec review for uf-fix-ci is complete and fresh. Workaround for resumed /uf.unleash sessions: verify the dispatch artifact directly (branch + mode + approving verdict + merge-base --is-ancestor) and confirm `git status --porcelain -- <feature_dir>` shows only the tasks.md line, then resume at implement instead of re-running the spec council. Do not re-run the review on unchanged artifacts.
