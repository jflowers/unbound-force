---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-20T17:24:48Z
identity: test-quality-20261020T172448-jay-flowers
tier: draft
---

Injectable-runner symmetry in test suites: when every test of a tool injects a fake runner, the default runner implementation ships with zero direct tests — the suite proves the default is never invoked but never pins its subprocess contract (argv, cwd, encoding, stdio, trim). Seen in .opencode/plugins/uf-workflow/index.ts defaultGhRunner (unleash-tier-routing change): all uf_unleash_resolve_issue tests inject fakes, so the execFileSync call shape is unobserved. Rule of thumb: pin default implementations with the same module-level mocked dependency used for the injection tests (one assertion on argv/options/return mapping), or record the deliberate gap in the design doc's risk notes.
