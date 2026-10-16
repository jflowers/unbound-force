---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-16T13:56:23Z
identity: uf-workflow-testing-20261016T135623-jay-flowers
tier: draft
---

Cross-plugin artifact contracts need a connecting test, not two-sided pinning with unrelated fixtures. When a writer tool's output is consumed by a reader in another plugin through an untyped passthrough (readFileSync → JSON.parse → Record<string, unknown>, as with write_unleash_summary → uf_finale_pr_context.unleashSummary), pinning the writer's shape against a test-local constant and the reader's passthrough against an arbitrary fixture leaves the field-name agreement unguarded: a writer rename committed together with its own test update keeps every suite green while downstream consumers read undefined. Close the loop with one test that feeds the writer's actual output (or a fixture imported/typed from the writer's exported shape) into the reader and asserts the consumed fields populate — especially when the change's tasks explicitly require that verification (unleash-deterministic-tools tasks 4.3/4.8, the #707 whatWasBuilt/howToVerify/testResults contract, verified by inspection in JSDoc rather than by any executable test).
