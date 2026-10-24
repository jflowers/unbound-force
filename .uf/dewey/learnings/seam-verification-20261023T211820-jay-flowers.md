---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-23T21:18:20Z
identity: seam-verification-20261023T211820-jay-flowers
tier: draft
---

Adding a plugin tool requires extending not only the tool-list assertions and golden site tests but every per-tool enumerated suite in the test directory — terminal-write hygiene suites, terminal-output pinning, per-tool error-code tests — and the ones that do not assert the tool list are the ones that silently miss the new tool, because they enumerate via individual test cases that still pass. Registry-driven suites (registration-surface.test.ts iterates the live registry) auto-cover new tools; enumeration-driven suites require manual extension. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR 812, council iteration 3, 2026-10-23): uf_finale_base_state shipped with the 9-tool registration lists, a golden site test (added in iteration 2), and unit tests, but the "terminal-write regression (Requirement 1)" suite in uf-finale.test.ts still pins only 8 of 9 tools — the plugin-terminal-hygiene invariant from fix-tui-git-output-leak is unpinned for the new tool's five exec calls. Recipe: when a diff adds a plugin tool, grep the test directory for an established sibling tool's name (e.g. "uf_finale_push_state") to enumerate every suite that names it, then verify the new tool's name appears in each enumeration; any suite mentioning the sibling but not the new tool is the gap. Complements seam-verification-20261023T162201 (golden census) and seam-verification-20261023T182909 (task scoping) by generalizing to all per-tool enumerations.
