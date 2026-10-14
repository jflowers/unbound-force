## Context

Diagnosis (verified against the live tree): the uf-workflow
and uf-finale plugins execute inside the opencode server
process, which shares its terminal with the TUI. Their tool
handlers re-emit captured git/gh subprocess output through
console.log/console.error -- 18 calls in uf-workflow and 32
in uf-finale -- and those writes interleave with the TUI's
alternate-screen rendering, corrupting the display. The
subprocess plumbing itself is already correct: every git/gh
child process is spawned with piped stdio (execFileSync with
stdio ["pipe","pipe","pipe"] in lib/uf-workflow-types.ts and
uf-finale; Bun.spawn with piped stdout/stderr in
review-dispatch; execFile with captured callbacks in
lib/review-dispatch-sibling-evidence.ts). The live
.opencode/ tree and the embedded
internal/scaffold/assets/opencode/ tree are byte-identical
and must remain so.

Constitution alignment carried over from the proposal: all
five principles PASS (v1.3.1). The decisions below are the
mechanism for that alignment.

## Goals / Non-Goals

### Goals

- Eliminate every terminal write from uf-workflow and
  uf-finale tool handlers so TUI rendering is never
  corrupted by stray git/gh output.
- Preserve agent-visible data: everything currently echoed
  is either already in the tool result envelope or is added
  to it (uf_finale_stage `files` array).
- Keep the live and embedded scaffold copies identical,
  verified by the existing drift-detection tests.

### Non-Goals

- No logging framework or logger replacement; the tool JSON
  envelope is the sanctioned output channel.
- No changes to subprocess invocation plumbing (already
  piped correctly everywhere).
- No changes to clean plugins (review-dispatch,
  invoke-agent) or lib/ executors.
- No TUI-side output suppression; the fix is at the source.
- No envelope schema changes beyond the uf_finale_stage
  `files` array.

## Decisions

1. **Straight deletion, no logger abstraction.** All 50
   console.log/console.error calls are removed outright.
   Errors already surface through the failure(msg, ...)
   envelope, and success data already flows through result
   envelopes. Introducing a logger would add a dependency
   and a second side channel, contrary to Composability
   First and the constitution's dependency-necessity rule.

2. **Envelope enrichment for uf_finale_stage.** The staged
   file list is currently console-only data. The success
   envelope gains `files: string[]`. This is an additive
   field on an ad-hoc JSON envelope; no strict schema
   rejects it. Observable Quality: the list becomes
   machine-parseable instead of a terminal echo the agent
   cannot read.

3. **CI poll progress dropped, not relocated.** ci_poll
   emits a progress message every 30 seconds while polling.
   The agent is blocked awaiting the tool result during
   this time, so the progress output has no consumer. The
   final check state is already returned in the envelope;
   silent waiting is correct behavior. The messages are
   deleted, not moved into the envelope.

4. **Both trees edited identically in the same change.**
   Each live edit is mirrored byte-for-byte in
   internal/scaffold/assets/opencode/. The drift-detection
   tests (TestEmbeddedAssets_MatchSource, a Go test run by
   make test) enforce equivalence; verification runs via
   make check (lint, Go tests including drift detection,
   build, coverage gate, and the plugin-test TypeScript
   suite: unit, integration, smoke, coverage).

5. **Two test changes planned.** No existing tests in
   .opencode/test assert console.log behavior (verified by
   grep), and the new `files` field has zero existing
   coverage (stage tests assert only fileCount). Per
   TC-006 (a bug fix MUST include a regression test that
   reproduces the original failure and verifies the fix),
   two test additions are planned: (a) a unit test on the
   envelope value asserting the staged file list and its
   empty-array default, and (b) a spy-based regression
   test in uf-workflow.test.ts and uf-finale.test.ts that
   wraps vi.spyOn(console, "log"/"error") around every
   per-handler invocation (success and error paths, via
   the existing invokeTool helper and mock GitExec) and
   asserts zero terminal writes -- failing on the
   pre-fix code and passing after the fix. Envelope
   contents and terminal writes are observable side
   effects per the Testability principle.

## Risks / Trade-offs

- **Operators lose terminal echoes of git activity.**
  Accepted: the TUI is the operator's interface, and
  corrupting it is worse than losing an echo nobody asked
  for. The agent reports tool results in-session.

- **ci_poll waits silently up to its timeout.** Mitigated:
  the tool result carries the final status; the TUI already
  indicates the agent is busy while awaiting a tool result.

- **Bulk deletion could clip surrounding logic.**
  Mitigated: edits are line-targeted against the 50-call
  inventory (18 uf-workflow + 32 uf-finale per tree); a
  post-edit grep MUST find zero remaining terminal-write
  calls (console.log, console.error, console.info,
  console.warn, console.debug, console.trace,
  process.stdout.write, process.stderr.write, Bun.write)
  in the four files.

- **Envelope change could break strict consumers.**
  Mitigated: the `files` field is additive on an ad-hoc JSON
  envelope with no closed schema; existing consumers ignore
  unknown fields.
