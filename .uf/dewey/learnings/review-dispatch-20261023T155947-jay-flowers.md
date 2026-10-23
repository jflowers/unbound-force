---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-23T15:59:47Z
identity: review-dispatch-20261023T155947-jay-flowers
tier: draft
---

When a command template documents required inputs for an MCP dispatch tool (e.g., dispatch_review_runs), each documented input must be anchored to a producing step in the same command's flow. Word-for-word parity with a sibling command's input list is necessary but not sufficient: the sibling's flow may produce the artifact while the target command's flow does not. Concrete case: /uf.address-feedback §2.3.4 now documents "diff_path: path to the saved immutable diff file" (matching uf.review-council §2 exactly), but address-feedback's flow only fetches the GitHub per-file inventory (§1.3) and never saves a diff — review-council produces its diff via capture_review_diff (local) or base_sha...head_sha diffing (PR), and review-pr anchors to "Step 3.6". The plugin's superRefine requires diff_path AND changed_files (string form) for every non-triage mode (feedback included), and the handler path-validates and reads the file at runtime, so agents must improvise a producer the template never specifies. When fixing documented-input drift, verify the command's own producer steps for every documented input, not just the tool schema and sibling wording.
