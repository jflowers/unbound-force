---
tag: plugin-tooling
author: jay-flowers
category: pattern
created_at: 2026-10-30T01:03:44Z
identity: plugin-tooling-20261030T010344-jay-flowers
tier: draft
---

When adding sibling tools to an OpenCode plugin, a comment reading "Mirrors X's prologue" marks DRY debt, not an exemption from it. In extend-fetch-pr-review-context, the gh availability/auth prologue (~30 lines: `which gh` Bun.spawn with 5s AbortSignal + `gh auth status` via runGhCommand) was copied verbatim into fetch_pr_checks and fetch_failed_run_logs, producing three near-identical copies in the same change that extracted a shared test harness citing CS-004's more-than-two-locations rule. The copying also tripled the blast radius of a pre-existing classification quirk: any `gh auth status` failure, including a transient timeout, is rebranded gh_auth_failed (retryable: false) by the prologue's catch, while the main fetch path correctly classifies timeouts as retryable. Extract shared prologues into a validateGhCli()-style helper at the second copy, and classify failures by the thrown error's ghCode annotation rather than rebranding in the catch.
