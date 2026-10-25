---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T13:35:49Z
identity: scaffold-pin-tests-20261025T133549-jay-flowers
tier: draft
---

Scoping a span-global negative pin removes fragility and removes coverage in the same edit. PR 815 feedback items 7 and 9 converge on one rule: the Step 5 build/test fix loop, nested inside the implementStep span, inherited the span-global "command_path:"-absent guard (scaffold_test.go:486) as its only command_path protection; narrowing that negative to the per-task delegation block (item 9's fix) silently unguards the nested fix-loop call site unless the dedicated loop-scoped delegation-shape pin (item 7's fix, rule in learning scaffold-pins-20261025T131742) lands in the same change. Ship the two scopings together — a scoping fix that drops a nested call site's incidental span coverage is a coverage regression dressed as a robustness fix. Attribution note: before describing a diff as introducing a pinned token into a span, census the token at base — PR 815's punctuation dependence pre-dated the diff (base uf.unleash.md:890 already carried a bare `command_path` mention inside the Step 5 span); the diff deepened the coupling with a second mention (head ~:889 omit-instruction) rather than creating it. Review recipe for any diff that adds a mention of a negatively-pinned token: (1) grep the token inside the extracted span at both base and head, (2) re-scope every affected negative to its own call-site block, (3) add a dedicated delegation-shape pin for any nested call site that was relying on the incidental span coverage.
