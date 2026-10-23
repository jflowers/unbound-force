---
tag: quick-address-feedback-diff-path-input
author: jay-flowers
category: gotcha
created_at: 2026-10-23T16:01:31Z
identity: quick-address-feedback-diff-path-input-20261023T160131-jay-flowers
tier: draft
---

During /uf.unleash Step 6 reviewer discovery (2026-10-23, branch quick/address-feedback-diff-path-input), the Glob tool returned "No files found" for the pattern .opencode/agents/divisor-*.md even though 9 divisor-*.md agent files exist in that directory — the tool does not match glob patterns rooted in the dotfile-prefixed .opencode directory. Reviewer discovery must use `ls .opencode/agents/` (or an equivalent shell listing) instead. Had the empty glob result been trusted, the fail-closed zero-discovered-reviewers rule would have incorrectly stopped the pipeline; always cross-check an empty agent glob with a directory listing before declaring a fail-closed stop.
