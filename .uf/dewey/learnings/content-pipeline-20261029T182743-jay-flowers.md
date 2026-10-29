---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-29T18:27:43Z
identity: content-pipeline-20261029T182743-jay-flowers
tier: draft
---

Content-pipeline dispositions (blog/tutorial declined) must be worded against the threshold being applied and must not contradict the same proposal's documentation-gate framing. In the extend-fetch-pr-review-context spec review (2026-10-29, iteration 2), the blog-decline rationale "no new user-facing capability debuts" sat in the same Impact section as the documentation-gate bullet "user-facing capability surface changes (new plugin tools shipped to every uf-init consumer via the scaffold mirror)". Both dispositions were individually correct — the documentation gate triggers on any capability-surface change while the blog significance threshold requires a new user-observable capability — but the undifferentiated wording reads as a contradiction, and the filing task copies the disposition verbatim into the docs-issue body, propagating it into the tracked record. Pattern: word declines as "below the blog/tutorial significance threshold because [threshold signal absent]" while separately acknowledging "the capability surface expands (documentation-gate bar) without new user-observable behavior".
