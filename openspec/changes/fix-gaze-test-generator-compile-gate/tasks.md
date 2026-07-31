<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Update canonical scaffold agent file

- [x] 1.1 Replace advisory compile prose in Important Constraints
  - File: `internal/scaffold/.opencode/agents/gaze-test-generator.md`
  - Replace the bullet reading "ALWAYS verify generated code
    compiles before reporting success" (line 276) with the
    concrete pre-write compile gate protocol:
    ```
    - Before any Write or Edit tool call that modifies a Go
      source or test file, MUST run compile verification:
      1. Run via bash: `go build ./path/to/package/...`
         (scoped to the target package)
      2. If the command exits with non-zero code, MUST NOT
         proceed with the Write or Edit call. Report the
         compilation error and continue to the next target.
      3. Only proceed with the Write or Edit call after a
         successful (exit code 0) compile check.
    ```

- [x] 1.2 Update Output Format section to reference pre-write gate
  - File: `internal/scaffold/.opencode/agents/gaze-test-generator.md`
  - In the Output Format section (around line 255, after the
    `go build` command), add a note that individual files have
    already been verified by the pre-write compile gate, and
    this final check is a full-package integrity verification.

## 2. Sync copies from canonical scaffold

- [x] 2.1 [P] Sync active runtime copy from scaffold
  - Source: `internal/scaffold/.opencode/agents/gaze-test-generator.md`
  - Target: `.opencode/agents/gaze-test-generator.md`
  - The active copy is currently 242 lines (an older version
    missing the `verify` action section). Copy the full
    updated scaffold content, then restore the active copy's
    scaffolded-by marker on line 16:
    `<!-- scaffolded by gaze v1.4.6 -->`
  - This resolves the existing drift between the active and
    scaffold copies.

- [x] 2.2 [P] Sync embedded CLI copy from scaffold
  - Source: `internal/scaffold/.opencode/agents/gaze-test-generator.md`
  - Target: `cmd/unbound-force/.opencode/agents/gaze-test-generator.md`
  - The embedded copy MUST be byte-identical to the scaffold
    copy (both use `<!-- scaffolded by gaze dev -->`).

## 3. Verification

- [x] 3.1 Verify copy consistency with explicit diff
  - The scaffold drift detection tests do NOT cover the
    gaze-test-generator agent file (it is listed in
    `knownNonEmbeddedFiles`). Verify manually:
    ```bash
    diff <(sed '16d' internal/scaffold/.opencode/agents/gaze-test-generator.md) \
         <(sed '16d' .opencode/agents/gaze-test-generator.md)
    diff internal/scaffold/.opencode/agents/gaze-test-generator.md \
         cmd/unbound-force/.opencode/agents/gaze-test-generator.md
    ```
  - First diff: scaffold vs active (excluding line 16
    scaffolded-by marker) must produce no output.
  - Second diff: scaffold vs embedded must produce no output.

- [x] 3.2 Run full build and test suite
  - Command: `make check` (or `go build ./... && go test -race -count=1 ./... && golangci-lint run`)
  - Verify no regressions from the agent file changes.

- [x] 3.3 Verify constitution alignment
  - Confirm the change aligns with Principle III (Observable
    Quality) by adding a concrete verification step that
    produces observable output.
  - Confirm the change aligns with Principle IV (Testability)
    by enforcing verification of observable side effects before
    writing.
  - No new dependencies introduced (Principle II).

## 4. Documentation Gate

- [x] 4.1 Assess CHANGELOG entry
  - Add a CHANGELOG.md entry:
    `fix: harden gaze-test-generator compile verification gate`
  - This is a behavioral change to the agent (it will now halt
    instead of writing broken tests), warranting a changelog
    entry.

- [x] 4.2 Assess documentation issue
  - This change modifies internal agent behavior (the
    gaze-test-generator's pre-write verification protocol).
    It does not change user-facing CLI commands, workflows, or
    hero capabilities. Exempt from documentation issue
    requirement per AGENTS.md: "Exempt: internal refactoring,
    test-only, CI-only, spec artifacts."

<!-- spec-review: passed -->
<!-- code-review: passed -->
