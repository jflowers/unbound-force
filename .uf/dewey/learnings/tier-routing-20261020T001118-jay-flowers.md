---
tag: tier-routing
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:11:18Z
identity: tier-routing-20261020T001118-jay-flowers
tier: draft
---

MUST-level safety floors that live only in judgment prose (skills or command instructions) can be neither enforced nor verified. In unleash-tier-routing, the risk-floor requirement (security-sensitive changes MUST never route to quick) has no mechanical enforcement — uf_unleash_route_decision accepts any valid tier — so its acceptance scenario cannot fail in CI. Pattern: thread the judgment layer's identified signals (e.g., risk_signals) into the deterministic tool and enforce the floor there with table-driven tests, or write the requirement at the enforcement level that actually exists (SHOULD plus documented compensating controls) so the spec never claims a guarantee the system cannot make.
