---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:31:08Z
identity: review-dispatch-20261031T003108-jay-flowers
tier: draft
---

The diff-manifest delivery mode implemented for local review dispatch (opsx/review-dispatch-diff-manifest, issue #877) is a reusable pattern for bounding reviewer prompt size without losing coverage: above the existing 1500-line DIFF_THRESHOLD, build_review_prompts stops inlining the full diff (a 2 MiB diff is roughly 500K tokens, beyond any model's context window) and instead persists a machine-parseable manifest beside the diff (<diff_path>.manifest.json, 0o600, schema version, SHA-256 digest, hunk-aligned chunk coordinates under a 256 KiB per-chunk budget, deterministic <path>#<index> chunk ids, persona-relevance hints that guide but never filter), serves content through a confined read_diff_chunk tool (manifest-path-validated, no arbitrary filesystem reads, fail-closed integrity checks, output wrapped in untrusted-evidence delimiters exactly like inline delivery), adds a **Files Reviewed**: coverage attestation to the manifest-mode response contract that consolidate_dispatch surfaces as an advisory quality signal, and grants a named 300-second MANIFEST_RETRIEVAL_ALLOWANCE_MS in per-run timeout derivation so the smaller prompts do not shrink run windows. At or below the threshold the prompts are byte-for-byte identical to the pre-change assembly, pinned by golden tests. The same shape — bounded index in the prompt, on-demand tool retrieval, attestation of what was actually consumed — mirrors the council-review-action prepare-diff.sh precedent and the opencode-session-notes manifest pattern, and generalizes to any multi-agent pipeline drowning on large payloads.
