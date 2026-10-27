---
tag: openspec-consistency
author: jay-flowers
category: gotcha
created_at: 2026-10-27T01:14:31Z
identity: openspec-consistency-20261027T011431-jay-flowers
tier: draft
---

In OpenSpec repos where a capability has no archived baseline (requirements live only in unarchived change deltas), a change that amends command prose pinned by a sibling requirement must carry a MODIFIED delta for that requirement — reconciling against a *different* capability does not discharge it. Concrete case: unleash-interactive-clarify extended the /uf.unleash Guardrails bullet to name a second mid-pipeline human interaction. The `unleash-autonomy` capability (between-step pauses only) was correctly unaffected, but the `unleash` capability's 'Guardrail consistency' requirement — carried live by unleash-deterministic-tools and unleash-direct-review-dispatch deltas mandating the Step 4 gate be named 'the single legitimate mid-pipeline human interaction' — was missed, leaving the implemented command non-compliant and the eventual capability baseline self-contradictory. Detection pattern: before concluding no MODIFIED delta is needed for prose a change rewrites, grep the requirement header ('### Requirement: Guardrail consistency') and its key normative phrase ('single legitimate mid-pipeline') across openspec/changes/** to enumerate every live owner — the same anchor discipline already applied to carried-forward requirement bodies.
