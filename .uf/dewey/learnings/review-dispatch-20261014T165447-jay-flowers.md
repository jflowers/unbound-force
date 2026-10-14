---
tag: review-dispatch
author: jay-flowers
category: reference
created_at: 2026-10-14T16:54:47Z
identity: review-dispatch-20261014T165447-jay-flowers
tier: draft
---

During review-council dispatch on a PR, the reviewing agent's working tree may be checked out at the BASE ref rather than the head under review — the provided diff is the only authoritative source for head-state content. Observed reviewing PR #723 (determinism-codification): a repo-wide grep showed README.md still reading "four core principles" and no openspec/changes/determinism-codification/ directory, proving the tree was at main even though the diff under review fixed exactly those lines. Detection recipe: grep for a distinctive changed line (e.g., the README principle count) — if the pre-change text is present, the tree is at base. Consequences: (1) citing working-tree state as head-state evidence produces false findings (e.g., "README not updated" when the diff updates it); (2) working-tree reads remain valid only for files untouched by the diff, which are identical at both refs (e.g., constitution-check.md for downstream-impact verification); (3) head-state claims (new pack contents, test registrations) must be verified from the diff plus CI evidence at the head SHA, not from local reads.
