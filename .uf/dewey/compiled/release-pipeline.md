---
tier: validated
compiled_at: 2026-10-25T16:41:23Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: release-pipeline
---

# Release Pipeline: Cross-Repo Patterns

## Current State (October 2026)

All four repos (dewey, gaze, replicator, unbound-force) ship a
`.github/workflows/release.yml` triggered via
`workflow_dispatch` that delegates preflight validation and
GoReleaser execution to SHA-pinned complytime/org-infra
reusable workflows (`reusable_release_preflight.yml`,
`reusable_release_goreleaser.yml`; gaze/dewey at v0.7.1,
replicator/unbound-force at v0.8.0). Preflight validates semver
format, tag uniqueness with re-run resilience, semver ordering,
CI check status, and unreleased commits before creating an
annotated tag. Current line counts: dewey 317, replicator 283,
gaze 372, unbound-force 399. `council-review-action/`
(composite GitHub Action in unbound-force) remains the standing
precedent for cross-repo extraction; replicator's extracted
Homebrew cask patch script followed it.

### Tag Input and env Binding Discipline

Under `workflow_dispatch`, `GITHUB_REF_NAME` is the branch
name, not the tag, so scripts MUST take the release tag from
`inputs.tag`. unbound-force passes `tag: ${{ inputs.tag }}` via
`with:` (release.yml:49) and binds shell-consumed values
through `env:` blocks (`RELEASE_TAG`, `GH_TOKEN`;
release.yml:115, 223). No `${{ }}` interpolation inside `run:`
blocks: inline interpolation of `github.ref`/inputs permits
shell injection (Adversary agent finding); `env:` binding is
the standing rule.

### Checks API Names

The Checks API `check_name` equals the job's `name:` field
(falling back to the job key). `ci_checks` lists passed to
preflight MUST use API-visible names: unbound-force
release.yml:52 lists "Build and Test" and "Plugin Tests",
matching the `name:` fields in ci_local.yml (:27, :71), not the
`build-and-test`/`plugin-tests` job keys.

### Branch Validation Gap

Feature-branch release rejection is currently implemented only
in dewey (release.yml:43-53, `validate-branch` job requiring
`refs/heads/main`). The replicator spec for this remains
unarchived; gaze, replicator, and unbound-force rely on
operator discipline plus preflight CI checks on HEAD.

## History

- **Shared awk url/sha256 ordering bug (RESOLVED)**: a
  checksum-patching awk script was once copied verbatim across
  all four repos and assumed `url` precedes `sha256` in cask
  output; GoReleaser version changes broke that ordering. All
  four repos are now order-agnostic: unbound-force since Oct 7
  (720b9da), dewey via `/on_macos/,/on_linux/` range matching,
  gaze via an order-agnostic variant, and replicator via an
  extracted, tested `.github/scripts/patch-homebrew-cask.sh`
  with `patch-homebrew-cask_test.sh` covering reorder cases —
  fully implementing the original simultaneous-fix
  recommendation.
- **Script duplication (largely resolved)**: 4 verbatim copies
  became 3 divergent local variants + 1 extracted tested script.
- **workflow_dispatch migration**: moving off `push.tags`
  changed `GITHUB_REF_NAME` from tag to branch name, forcing
  the inputs.tag/env: discipline above.
- **Tag idempotency**: preflight re-runs must exclude the
  release tag from duplicate detection; now owned by org-infra.
- Source learnings: dewey release-pipeline (2), dewey
  release-workflow (3), replicator ci-release-preflight (3).
