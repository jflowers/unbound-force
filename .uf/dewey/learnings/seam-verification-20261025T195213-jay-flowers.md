---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-25T19:52:13Z
identity: seam-verification-20261025T195213-jay-flowers
tier: draft
---

Insertions in a command markdown file shift every [command.md:NNN] documented-site annotation in the golden-output-shape registry for sites after the edit point, and a partial rename pass leaves the registry internally inconsistent while the suite stays green — the census comment and the nearby shifted test names get updated, but enumeration-driven test names further down silently keep the pre-shift line number, because the annotations are display labels, not assertions. Verified on fix-push-state-catch-to-zero (unbound-force/unbound-force quick branch, council iteration 2, 2026-10-25): an 8-line PUSH_SYNC_COUNT section inserted at uf.finale.md:174 shifted four documented sites by +8; the rename pass updated pr_context (204→212), create_pr (262→270), and ci_poll (270→278) but missed return_to_main — golden-output-shape.test.ts:1020 still reads [uf.finale.md:349] while the registry comment (line 59) and the actual command file both say 357. Extends seam-verification-20261023T211820 (enumeration-driven suites silently miss new tools) to line-shift renames: partially-updated enumerations pass. Recipe: after any command-file line insertion or deletion, grep the golden test file for that command's `.md:` annotations and verify each against the grep-verified actual line of its documented site in the command file; a comment/test-name disagreement is the tell.
