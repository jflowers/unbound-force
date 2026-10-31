---
tag: golden-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-31T00:35:47Z
identity: golden-tests-20261031T003547-jay-flowers
tier: draft
---

TS golden tests anchor test names and census comments to command-file line numbers (e.g. 'parse_tasks [uf.unleash.md:924]', census 'format_unleash_exit x8 (513, 794, 1210, 1262, 1366, 1443, 1632, 1662)'). The labels are documentation-only — nothing fails when .opencode/commands/*.md gain or lose lines, so anchors drift silently across unrelated edits (pre-refresh state: format_unleash_exit anchors off by 278-770 lines; resolve_base_ref 126→132 and normalize_model_name 801→910 stale from earlier unrelated edits). When a diff touches any uf-*.md command file, grep-verify every .md:NNN anchor in .opencode/test/golden-output-shape.test.ts and .opencode/test/dispatch-review-runs.test.ts against the post-edit files; those two are the only TS files carrying such anchors (verified 2026-10-30), and internal/scaffold Go command contracts use position-independent phrase clauses with no line anchors at all. Refresh method that verified clean: grep each tool name in the edited command, map every documented call site to its test label, and require each label to hit an actual line.
