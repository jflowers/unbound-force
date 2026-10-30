---
tag: content-pipeline
author: jay-flowers
category: decision
created_at: 2026-10-16T17:28:45Z
identity: content-pipeline-20261016T172845-jay-flowers
tier: draft
---

When triaging blog/tutorial opportunities for a repair change that restores previously-intended behavior (e.g., fix-tool-args-schema-mismatch converting parameters: plain objects to zod args: shapes, restoring model-invokable uf-workflow/uf-finale tools), content-pipeline significance thresholds compare against the intended pre-break baseline, not the broken interim state: restored capability is not new capability. No blog issue is required (no new agent, CLI command, architectural migration, or hero capability) and no tutorial issue is required (no new command workflow, tool integration, or workflow pattern). The documentation gate still applies because user-visible workflow behavior changes relative to the broken state — requiring the CHANGELOG entry plus both documentation issues (in-repo and unbound-force/website per the org constitution's Cross-Repo Documentation rule). Verified in the PR #744 review: gates satisfied via #740 + website#310, and both content-pipeline checks correctly skipped.
