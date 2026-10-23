---
tag: spec-review
author: jay-flowers
category: pattern
created_at: 2026-10-22T20:51:13Z
identity: spec-review-20261022T205113-jay-flowers
tier: draft
---

When reviewing an OpenSpec change that modifies an existing requirement, verify two factual anchors before approving: (1) the carried-forward baseline — diff the MODIFIED requirement's restated MUSTs against the prior change's delta for the same requirement (Dewey indexes prior openspec/changes/* deltas; e.g. delegation-skill-enforcement's variant-fallback and structural-failure paragraphs matched unleash-pipeline-hardening's text verbatim, confirming a faithful rebase); and (2) the "Previously:" paragraph and every file path, call-site count, section name, and example the spec asserts — read the working tree to confirm they exist (the delegation-skill-enforcement spec's example script .specify/scripts/bash/check-prerequisites.sh, its three prompt-only uf_delegate_command call shapes at uf.unleash.md ~718/803/1195, and its referenced test files all verified; note that glob respects .gitignore and silently returns empty for .opencode/test/ and .specify/scripts/, so directory reads are needed there). Spec deltas that assert a current-state inventory are only as reviewable as that inventory is true; a two-minute anchor check catches stale inventories before they harden into requirements.
