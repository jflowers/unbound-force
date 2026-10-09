---
tag: review-dispatch-coverage
author: jay-flowers
category: gotcha
created_at: 2026-10-09T03:17:07Z
identity: review-dispatch-coverage-20261009T031707-jay-flowers
tier: draft
---

The review-dispatch plugin's coverage gate requires 85% branch coverage. When adding a new tool with complex error handling paths, the coverage can drop below this threshold if error branches aren't exercised. In the build_review_prompts implementation, three uncovered branches initially dropped coverage to 84.93% (0.07% below threshold): (1) total assembled prompt exceeding MAX_PROMPT_BYTES (4 MiB), (2) writeFile catch for prompt_write_failed, and (3) a pre-existing uncovered readdir catch in dispatch_status. The fix was adding a test that creates multiple large optional sections (1.5 MiB diff + three 950 KB sections) to trigger the total-size check. When adding tools to this plugin, plan for coverage tests of all error return paths — especially size limits and I/O failure catches — from the start rather than discovering the gap at the verification phase.
