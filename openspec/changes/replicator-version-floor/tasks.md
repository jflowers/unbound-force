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

## 1. Version floor implementation (internal/doctor/checks.go)

All tasks in this group modify `internal/doctor/checks.go`
and MUST run sequentially.

- [x] 1.1 Add the `replicatorMinVersion` constant set to
  `0.7.0` at package level (design D5), with a GoDoc comment
  stating it is the minimum Replicator version the doctor
  accepts and pointing to this change for provenance.
- [x] 1.2 Add `parseReplicatorVersion(output string) (string,
  error)` (design D4): locate the token after the `version`
  keyword, strip a leading `v`, cut at the first `-`, and
  validate the remainder is numeric `major.minor.patch`;
  return an error for any other shape.
- [x] 1.3 Add a three-part (major.minor.patch) numeric
  version comparison helper (design D4) that reports whether
  a parsed core version is at or above the floor. Do not
  reuse `parseVersionParts` (major.minor only).
- [x] 1.4 Insert the version-floor sub-check into
  `checkReplicator` between binary presence (Check 1) and
  `replicator doctor` delegation (Check 2) per design D1,
  D3, D6, D7: run `replicator --version` via
  `opts.ExecCmdTimeout(5*time.Second, ...)`, emit a
  `CheckResult` named `replicator version` with the
  severities, messages, hints, and install URL from design
  D6, and never early-return or suppress the remaining
  sub-checks.

## 2. Tests (internal/doctor/doctor_test.go)

All tasks in this group modify
`internal/doctor/doctor_test.go` and MUST run sequentially
after group 1.

- [x] 2.1 Add unit tests for `parseReplicatorVersion` and the
  comparison helper covering: the verbatim real-world output
  `replicator version v0.6.0-7-gea86d27-dirty` parses to
  `0.6.0`; plain `replicator version v0.7.0` parses to
  `0.7.0`; missing `v` prefix, missing patch component,
  empty output, and bare `replicator version` with no version
  token all return errors; the comparator accepts equal
  cores, higher patch, higher minor, and rejects lower minor
  and lower patch.
- [x] 2.2 Extend the `checkReplicator` tests (pattern of
  `TestCheckReplicator_AllPass` / `TestCheckReplicator_NotInstalled`)
  to cover every spec scenario: v0.7.0 exactly → Pass with
  the version in the message; v0.8.2 → Pass; v0.6.0 → Warn
  with the floor in the message and `brew upgrade` in the
  hint; `v0.6.0-7-gea86d27-dirty` → Warn; `v0.7.0-3-gabcdef`
  → Pass; version-command error and timeout → Warn with
  "version could not be verified" while the doctor
  delegation, `.uf/replicator/`, and MCP config results are
  still present; unparseable output → Warn; binary absent →
  no `replicator version` result.
- [x] 2.3 Add a JSON-visibility test (or extend the existing
  doctor JSON test) asserting the serialized Replicator group
  results include the `replicator version` result with its
  severity and message.

## 3. Documentation and verification

- [x] 3.1 [P] Add a `CHANGELOG.md` entry describing the
  Replicator v0.7.0 version floor, the warn behavior, and
  the `brew upgrade unbound-force/tap/replicator` upgrade
  path.
- [x] 3.2 [P] File a documentation issue against this repo
  per the AGENTS.md documentation gate (user-facing `uf
  doctor` output change), linking this change.
  (Filed: unbound-force/unbound-force#844; website tracking
  issue: unbound-force/website#337.)
- [x] 3.3 Run CI-parity validation locally per AGENTS.md:
  `go test -race -count=1 ./...`, `make lint`,
  `make coverage-gate`. All MUST pass with no coverage
  regression in `internal/doctor`.
- [x] 3.4 Opportunistic end-to-end check: run
  `go run ./cmd/unbound-force doctor` on a machine with a
  Replicator binary and confirm the Replicator group shows
  the version result (a v0.6.x install demonstrates the warn
  path; a v0.7.0+ install demonstrates the pass path). Skip
  with a note if no replicator binary is available.
- [x] 3.5 Verify constitution alignment per the proposal:
  confirm the implementation warns (never fails) for
  below-floor versions, the result serializes into doctor
  JSON output, all new tests run isolated via stub
  injections with no real binary or network required, and no
  quality gate was modified. Report any conflict and stop
  rather than adjusting a gate.
