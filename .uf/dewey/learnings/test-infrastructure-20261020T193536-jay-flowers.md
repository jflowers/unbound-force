---
tag: test-infrastructure
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:35:36Z
identity: test-infrastructure-20261020T193536-jay-flowers
tier: draft
---

When a test suite's verified properties are enumerated in evidence artifacts (CHANGELOG entries, DE-004 metrics matrices), audit each advertised property for vacuity before the claims land. Two mechanical vacuity forms: (1) a biconditional is vacuous when a preceding assertion in the same test makes its operands identical — e.g., keys(args ∪ parameters) vs keys(args) after asserting `parameters` is absent; (2) a "parity" comparison is vacuous when both operands derive from the same object — e.g., Object.keys(z.object(args).shape) vs Object.keys(args), since zod's .shape carries the same keys as the raw shape passed in. Both forms pass forever while the evidence reads stronger than the machine check. Audit procedure: for each advertised property, name the input mutation that would fail it; if no mutation can fail it, either re-implement the assertion against a surface that can falsify it (execution-based: schema-valid input accepted, schema-violating input rejected) or drop the property from the evidence text. Observed in the seam-verification review (unbound-force, PR 783, 2026-10): registration-surface.test.ts was advertised in CHANGELOG.md and metrics.md as providing "zod parity between the TS and JSON-schema declarations" while both parity operands were the same args object; the effective mis-registration guards were the not-parameters and instanceof ZodType checks.
