<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Add ResolveRelease to Options

- [x] 1.1 Add `ResolveRelease func(repo string) (string, error)`
  field to the `Options` struct in `internal/setup/setup.go`
  with GoDoc comment per FR-001. Include `repo` parameter
  validation (`^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`) per FR-004
- [x] 1.2 Implement the production default in `defaults()`:
  invoke `gh release view --repo {repo} --json tagName
  -q .tagName` via `opts.ExecCmd`, trim whitespace, strip
  `v` prefix, validate semver format
  (`^[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}$`) and length
  per FR-002
- [x] 1.3 Update the `Options.Version` GoDoc comment to
  clarify it is the uf binary's version and is not used
  for companion tool RPM URLs
- [x] 1.4 Reorder `buildSteps()` to place `installGH` before
  `installGaze` per D6 — move GitHub CLI from step 3 to
  step 2, shift Gaze from step 2 to step 3

## 2. Wire resolved versions into RPM call sites

- [x] 2.1 Modify `installGaze()`: call
  `opts.ResolveRelease("unbound-force/gaze")` before
  `installViaRpm()`. On error, return a `stepResult` with
  action "failed" and the resolution error per FR-003
- [x] 2.2 Modify `installReplicator()`: same pattern as 2.1
  for `"unbound-force/replicator"` per FR-003

## 3. Tests

All test tasks modify `internal/setup/setup_test.go`.

- [x] 3.1 Add unit tests for the production `ResolveRelease`
  default: valid tag with `v` prefix, valid tag without
  prefix, invalid format, tag too long, `gh` CLI failure,
  whitespace-padded output, empty output, pre-release tag
  format, malformed repo format (FR-002 + FR-004 scenarios).
  Use `&Options{}` consistently (pointer receiver)
- [x] 3.2 Add regression test for issue #455:
  `TestInstallGaze_Issue455_UsesResolvedVersionNotOptsVersion`
  — inject `ResolveRelease` returning a version distinct
  from `opts.Version`, verify via `cmdRecorder` that the
  `dnf install` URL contains the resolved version and NOT
  `opts.Version` (FR-003 scenario)
- [x] 3.3 Add test for `installReplicator` dnf path with
  injected `ResolveRelease` — same regression assertions
  as 3.2 for `"unbound-force/replicator"`. Use `&Options{}`
  (pointer receiver)
- [x] 3.4 Add test for `installGaze` dnf path when
  `ResolveRelease` returns an error — verify the result
  has action "failed" and detail includes the error message
  with actionable context
- [x] 3.5 Add test for dry-run mode with resolved version —
  verify the dry-run detail shows the URL with the
  resolved version
- [x] 3.6 Add test for `buildSteps` order — verify `installGH`
  step index is less than `installGaze` step index (D6)

## 4. Verification

- [x] 4.1 Run `make check` (lint + test + build) — all
  checks MUST pass
- [x] 4.2 Verify constitution alignment: Principle II
  (Composability First) — confirm RPM URLs use per-tool
  versions; Principle IV (Testability) — confirm
  `ResolveRelease` is injectable and all tests run
  without network access
- [x] 4.3 Verify error messages from failed `ResolveRelease`
  include actionable guidance (e.g., suggest `--method go`
  or `tool_methods.gaze: go` config)
- [x] 4.4 [P] Update CHANGELOG.md with a bugfix entry under
  the Unreleased section referencing issue #455

<!-- spec-review: passed -->
<!-- scaffolded by uf vdev -->
