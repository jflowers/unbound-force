---
tag: command-contract-tests
author: jay-flowers
category: pattern
created_at: 2026-10-17T14:52:41Z
identity: command-contract-tests-20261017T145241-jay-flowers
tier: draft
---

Command-content pins for a prose-to-tool migration must be derived from the spec requirement's enumerated call-site list, not from the span a review fix touched. Per-call-site pins added in response to feedback inherit the feedback's blind spots. Observed in PR 745 round 4: the spec's "Command delegation tool" requirement enumerated four migration surfaces (Steps 2/3 plan/tasks, per-task implement, Step 6 code-fix), but TestUnleashCommand_ToolRoutingContracts pinned only the feedback-named fix-loop site, replicating the delegation-migration miss pattern where the Step 8 call site was missed across three rounds. Mechanical check: extract every enumerated call site from the spec delta, grep the command-content test for a pin per site (tool name plus distinguishing parameters per span), and treat any unpinned enumerated site as an open silent-regression window. Prefer per-span negative assertions (e.g. "via the Task tool" absent between two anchors) over command-wide greps, which both dilute the check and can false-positive on legitimately unchanged prose.
