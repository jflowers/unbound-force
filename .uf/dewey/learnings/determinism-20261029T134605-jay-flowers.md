---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:46:05Z
identity: determinism-20261029T134605-jay-flowers
tier: draft
---

When a spec invariant defines a constant by reference to another module's value (e.g., RD-FR-028's derived timeout "MUST NOT exceed 1_800_000 milliseconds (the existing TimeoutSchema/validateTimeout bound)"), the depending module needs an executable equality pin expressed as a behavioral drift test: import the referenced schema in the test file only, and assert safeParse(constant).success === true and safeParse(constant + 1).success === false. Test-only imports preserve the production module's purity (no zod dependency leaks into pure derivation modules), and co-locating the pin in the depending module's test file keeps the invariant visible at the seam where it can drift. Transitive pins in other test files (via input schemas that .max() the constant) verify the plugin input surface, not the referenced bound itself — the referenced schema's literal can still drift undetected.
