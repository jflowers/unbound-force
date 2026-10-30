---
tag: feedback-triage
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:38:13Z
identity: feedback-triage-20261029T133813-jay-flowers
tier: draft
---

Three-signal triage heuristic for LOW-severity DRY feedback (duplicated logic across two call sites): (1) convention threshold — check the convention pack's extraction mandate (default.md CS-004 mandates DRY extraction only for logic in more than two locations; exactly two is below threshold, so the feedback is advisory, not a MUST violation); (2) semantics vs wiring — determine whether the semantic core is already shared (extracted formula module + shared types + per-path provenance tests) and only input sourcing is duplicated; duplicated wiring with anchored observability is far lower risk than duplicated semantics; (3) mirror-sync cost — check for byte-identical scaffold mirrors (AGENTS.md commit-scope/scaffold-mirror rules) that double the edit cost of any extraction. Applied to PR #860 feedback item 9 (duplicated derivePerRunTimeoutMs input assembly between dispatch index.ts:4895 and redispatch index.ts:6405 call sites): all three signals resolved to AUTHOR-DECIDES — no convention violation, semantic core already shared per design D3 with per-site assembly documented as intentional per design D2, and extraction would require synchronized edits to the internal/scaffold/assets mirror. When offering the author an extraction path, shape it as a parameterized helper mirroring existing sharing precedents (e.g., buildTimeoutSignals(runtime, timeoutLimits, promptBytes, sessionProfileTier, maxParallelRuns, explicitTimeoutMs) following resolvePlanEntryRuntime/resolveTimeoutLimits).
