---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:50:04Z
identity: uf-unleash-20261022T225004-jay-flowers
tier: draft
---

uf_unleash_detect_resume derives spec-review completion from the most recent current-branch dispatch artifact with an approving verdict (artifacts authoritative over checkpoint claims). Checkpoint-recorded human resolutions such as overrides do not mark the gate complete: a session that finished the spec-review gate via overrides alone re-runs spec review on pipeline resume, and the fresh dispatch's findings must be reconciled against the durable override records — with no spec-defined matching key, an executing agent re-presents overridden findings at its own discretion. Any future gate that lets humans resolve findings without changing the verdict artifact needs explicit resume-completion semantics. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
