---
tag: uf-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-27T13:39:43Z
identity: uf-workflow-20261027T133943-jay-flowers
tier: draft
---

When a delegation-based orchestrator routes a child command whose consent gates are unconditional (e.g., /uf.finale's Step 3 commit approval, which fires on every run), the delegation's stated expected outcome must be framed as the wedge/handoff point — the child drives the mechanical pre-work (branch check, staging, commit-message preparation) and wedges at the first consent gate, and the human completes the child command interactively, resuming from the child's checkpoints — not as the child's completion. Two rules follow: (1) a delegation whose child crosses an unconditional question gate can never return the child's end-state artifact, so an "expected outcome: PR URL" style claim is unsatisfiable by the delegation itself; (2) recovery paths for gate wedges must not license the orchestrator to perform the child's consent-gated steps directly, because the orchestrator's question scope excludes those gates — gate decisions must route through the orchestrator's own pause-relay question, and direct-drive must be bounded to post-consent mechanical steps. Observed in the update-run-pipeline-plan review: the two-path gate-timeout recovery ("human clears the gate... or the orchestrator drives the remaining steps directly") is grammatically parsed as licensing consent bypass for the routine finale wedge, since the MUST NOT clause binds only re-delegation.
