---
tier: validated
compiled_at: 2026-08-14T19:55:49Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: release-pipeline
related: scaffold, review-council
---

# Release Pipeline: Cross-Repo Patterns

## Current State (August 2026)

Release pipelines across 4 repos (dewey, gaze, replicator, unbound-force) share common patterns and a known shared bug. 5 learnings from dewey and 3 from replicator capture the critical issues.

## Shared Awk Checksum Bug (CRITICAL)

A checksum-patching awk script is COPIED across all 4 repos' `release.yml` files (415/400/333/284 lines). The script assumes `url` appears before `sha256` in Homebrew cask output, but GoReleaser version changes can alter this ordering.

**Fix**: Use order-agnostic awk range matching (`/on_macos/,/on_linux/`) instead of positional assumptions. This fix MUST be applied to all 4 repos simultaneously.

**Precedent for cross-repo reuse**: `council-review-action/` already exists as a composite GitHub Action. The awk script is a candidate for similar extraction.

## workflow_dispatch Semantics

Changing from `push.tags` to `workflow_dispatch` trigger changes `GITHUB_REF_NAME` semantics:
- `push.tags`: `GITHUB_REF_NAME` = tag name (e.g., `v1.2.3`)
- `workflow_dispatch`: `GITHUB_REF_NAME` = branch name (e.g., `main`)

**Impact**: All scripts using `GITHUB_REF_NAME` for version extraction must switch to `inputs.tag` or explicit `env:` binding.

## Tag Idempotency

For idempotent re-runs of release preflight (which creates tags), the tag query MUST exclude the release tag itself:
```bash
git tag --list | grep -v "^${RELEASE_TAG}$"
```
Without this, re-running preflight after a failed release incorrectly reports the tag as duplicate.

## Security: Shell Injection

Pass `github.ref`/`inputs` via `env:` bindings, NOT `${{ }}` interpolation in shell scripts. The Adversary agent caught that `github.ref` inline allows shell injection, while `inputs.tag` via `env: RELEASE_TAG` is safe.

**Also flagged**: Branch validation to prevent releases from feature branches (replicator ci-release-preflight).

## Checks API

The GitHub Checks API `check_name` equals the job's `name:` field, falling back to the job key. `REQUIRED_CHECKS` arrays in CI configuration must use the API-visible name, not the workflow-internal job key.

## History
- dewey release-pipeline (2): Awk ordering bug, cross-repo duplication
- dewey release-workflow (3): workflow_dispatch semantics, tag idempotency, Checks API
- replicator ci-release-preflight (3): Shell injection, branch validation
