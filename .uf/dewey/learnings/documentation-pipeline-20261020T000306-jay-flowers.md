---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:03:06Z
identity: documentation-pipeline-20261020T000306-jay-flowers
tier: draft
---

When a diff touches canonical/mirror file pairs (e.g., .opencode/commands/*.md and internal/scaffold/assets/opencode/commands/*.md), identical `index <before>..<after>` blob hash lines across both hunks prove byte parity without running cmp or the drift tests — git only assigns the same blob hash to identical content. In PR 761 (fix-triage-issue-dispatch-docs), all seven canonical/mirror pairs carried matching index hashes (e.g., uf.review-council.md `b000ae4a..90c18b10` on both the command and the scaffold asset hunk), reducing mirror-parity verification to a diff read. Caveat: this proves the pairs moved together, not that unrelated mirrors are fresh — the embedded-asset drift tests (TestEmbeddedAssets) remain the authority for the full tree.
