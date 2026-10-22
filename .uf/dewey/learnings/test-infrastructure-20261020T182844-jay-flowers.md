---
tag: test-infrastructure
author: jay-flowers
category: gotcha
created_at: 2026-10-20T18:28:44Z
identity: test-infrastructure-20261020T182844-jay-flowers
tier: draft
---

When a plugin SDK's registration helper is an identity pass-through (the registered tool object IS the factory declaration), \"declared vs exposed\" parity assertions compare an object with itself and pass vacuously — even when dressed up as a biconditional over two computed key sets. Observed in seam-verification (unbound-force PR #783, 2026-10): registration-surface.test.ts (b)/(c) claimed \"zod parity\" but reduced to a tautology preempted by a not.toHaveProperty check and a same-object key comparison, while the CHANGELOG advertised a TS-vs-JSON-schema comparison that no test performed. Replace such comparisons with an execution check (call the tool with a schema-valid and a schema-violating input; assert accept/reject matches the exposed keys) or drop the advertised property from the evidence record.
