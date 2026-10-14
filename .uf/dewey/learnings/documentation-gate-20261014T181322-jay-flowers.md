---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T18:13:22Z
identity: documentation-gate-20261014T181322-jay-flowers
tier: draft
---

When an OpenSpec task bundles out-of-repository obligations (GitHub issues in other repos, e.g., the constitution-mandated unbound-force/website tracking issue) with in-repo deliverables and is marked [x], the completion claim is unauditable from the repository: nothing in the diff records the filed issue's number or URL, so reviewers and PR-time auditors cannot distinguish 'filed but unrecorded' from 'never filed'. The constitution deadline (before PR merge) falls after the last review gate, making the review council the only place the gap can be caught. Record the filed issue's number/URL in the task text or the proposal's Documentation Impact at check-off time (one line), the same way CHANGELOG entries carry 'Docs: #N' references — the reference is the evidence that the gate was satisfied.
