---
tag: scaffold-mirrors
author: jay-flowers
category: gotcha
created_at: 2026-10-28T16:59:23Z
identity: scaffold-mirrors-20261028T165923-jay-flowers
tier: draft
---

In unbound-force, review-matrix schema and plugin assets are mirrored across up to three locations: the root canonical registry (schemas/review-matrix/), the .uf/ scaffolded copy, and the embedded scaffold asset (internal/scaffold/assets/uf/). Only a subset of this copy graph is test-enforced — task42CanonicalAssets maps embedded<->.uf schema identity and the review-dispatch plugin<->index.ts, while root-registry<->.uf identity is convention-only. New .opencode/lib/ modules imported by drift-enforced plugin assets also fall outside the fixed asset-surface enumeration unless explicitly added. Consequence: spec changes touching mirrored assets must enumerate every copy (plus samples, READMEs, and new lib modules) in their Impact section and tasks; an omitted sync target fails silently — an adopting repo can receive a drift-enforced plugin asset importing a lib module it never got. Precedent: optional-profile-models task 5.2 explicitly updated scaffold assets when creating schema v3.
