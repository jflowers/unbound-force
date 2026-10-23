---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-23T14:56:41Z
identity: documentation-pipeline-20261023T145641-jay-flowers
tier: draft
---

Adjacent-surface docs issues need in-body scope disambiguation. When a change touches a subsystem that already has open docs trackers from recent changes, a keyword duplicate-check surfaces all of them at once: on 2026-10-23, gh issue list --label docs --search "correlation dispatch" in unbound-force/unbound-force returned both #766 (fix-review-dispatch-recovery, #751) and #808 (fix-review-dispatch-correlation-release, #794), and the website equivalents were #313 vs #319. What made the checks trivially resolvable: website #319 opened with an explicit scope split ("This complements #313 (same recovery-tool surface, new lifecycle semantics; not a duplicate) — #313 covers the recovery workflow tools; this issue covers the session lifecycle those tools operate on"), and #808 anchored its scope via the root-cause issue number and spec directory name. Pattern for filing docs issues on repeatedly-touched subsystems: (a) run the keyword duplicate-check first, (b) name the adjacent open trackers in the new issue body, (c) state the one-sentence scope split between them, (d) anchor scope to an immutable reference (originating issue number / spec path) rather than to prose similarity.
