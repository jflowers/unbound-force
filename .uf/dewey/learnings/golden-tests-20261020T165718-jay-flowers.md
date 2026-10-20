---
tag: golden-tests
author: jay-flowers
category: pattern
created_at: 2026-10-20T16:57:18Z
identity: golden-tests-20261020T165718-jay-flowers
tier: draft
---

When a golden/contract test suite pins a multi-variant rendered-output tool (e.g. format_unleash_exit with eight exit variants selected by an internal variant enum), parametrize the EXPECTED output, not just the inputs. Asserting only the template sections shared by every variant (heading prefix, Reason, What to do next, Then resume) leaves the variant-selection seam unpinned: a regression that renders the wrong variant's body passes every shared-section assertion while registration, envelope, and lib-level tests stay green — the exact registration-correct-but-documented-output-wrong defect class golden suites exist to catch. Pin at least one variant-specific marker per case (the variant name in the heading, or a section only that variant renders — "Failed task", "Persistent findings", "Q1 + Context"), and keep test titles honest: a title claiming "the exact template text" should assert variant-specific content, not just the common skeleton. Observed in the seam-verification review (unbound-force, 2026-10): 8 of 43 golden sites were pinned at skeleton-only depth despite the fixture inventory enumerating per-variant documented output.
