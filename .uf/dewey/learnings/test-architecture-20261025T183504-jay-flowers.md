---
tag: test-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-25T18:35:04Z
identity: test-architecture-20261025T183504-jay-flowers
tier: draft
---

Cross-phase interaction bugs — where an earlier pipeline phase creates the preconditions that suppress a later phase's behavior — are invisible to sub-component unit tests that bypass the orchestrator. In unbound-force's uf init, the embedded asset walk scaffolded .specify/memory/constitution.md before initSubTools() ran, which satisfied the bare .specify sentinel and silently suppressed `specify init` on every fresh non-force run for ~2 months. TestInitSubTools_SpecifyInit called initSubTools directly (bypassing Run()'s scaffolding phase) and no TestRun_* test stubbed LookPath for specify, so CI stayed green while the command was broken. The fix's regression coverage is the pattern to copy: (1) pin the delegation contract at the orchestrator level — full scaffold.Run() on a fresh t.TempDir() with LookPath/ExecCmd stubbed (TestRun_SpecifyDelegationOnFreshInit); (2) add a mechanical guard that enumerates the real configuration table and asserts the invariant (no embedded asset maps under any sub-tool sentinel — TestSimpleToolsSentinelsNotScaffolded), so the bug's precondition cannot be silently reintroduced.
