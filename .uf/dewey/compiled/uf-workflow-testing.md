---
tier: validated
compiled_at: 2026-10-25T16:34:44Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - test-fixture-hygiene-20261011T013729-jay-flowers
  - typescript-plugin-testing-20261012T235625-jay-flowers
  - uf-workflow-testing-20261015T201843-jay-flowers
  - uf-workflow-testing-20261015T203359-jay-flowers
  - uf-workflow-testing-20261015T213217-jay-flowers
  - uf-workflow-testing-20261016T135623-jay-flowers
  - uf-workflow-testing-20261016T152656-jay-flowers
  - uf-workflow-testing-20261016T162810-jay-flowers
  - uf-workflow-testing-20261016T162816-jay-flowers
  - uf-workflow-testing-20261016T202420-jay-flowers
  - uf-workflow-testing-20261016T225128-jay-flowers
  - uf-workflow-testing-20261016T225130-jay-flowers
  - uf-workflow-testing-20261017T031909-jay-flowers
  - uf-workflow-testing-20261017T142218-jay-flowers
  - plugin-testing-20261022T121717-jay-flowers
topic: uf-workflow-testing
---

# UF Workflow Testing

Testing doctrine for the `.opencode/plugins/` uf-workflow tool family: drive real implementations through injected dependencies, pin
contracts structurally, and keep fixtures honest about branch, encoding, and scenario state.

## Current State (October 2026)

### Driving real implementations

- Tool factories accept injected dependencies — a `GitExec` function plus `cwd` (uf-finale precedent) or `DelegateCommandDependencies`
  `{client, readText, fileExists}` — so tests drive real tool logic rather than stubbing results. `executeAgentSession` runs via the
  `fakeClient` pattern (invoke-agent.test.ts): recording session.create/message/prompt/abort fakes, responses cast `as unknown as X`
  via an identity `fieldsResponse` helper.
- fakeClient mechanics: the parent-message fake reports role "assistant" plus a VariantSchema-valid variant (default "default") or host
  resolution fails; the child prompt fake echoes `request.body.model` so `model_mismatch` never trips; `hangPrompt:true` + `timeout:5`
  exercises real timeout propagation (DELEGATE_FAILED, retryable, one `session.abort`); `hangMessage:true` plus `controller.abort()`
  after a `setTimeout(0)` tick exercises host-resolution cancellation (DELEGATE_CANCELLED before any create).
- Filesystem-free checkpoint testing: `vi.mock("node:fs", importOriginal)` overriding
  existsSync/lstatSync/readFileSync/mkdirSync/writeFileSync. The first-checkpoint path defaults `lstatSync` to throw
  `Object.assign(new Error(msg), { code: "ENOENT" })` — `isEnoent` checks `err.code`, so a plain `new Error("ENOENT")` does NOT work.
  The existing-state path mocks `lstatSync` to `{ isSymbolicLink: () => false }` and `readFileSync` to prior ProgressState JSON.
  `node:fs/promises` is a separate specifier unaffected by the `node:fs` mock — stub via the `readText` dependency.
- Assert via recorded calls and parsed JSON arguments: `writeFileSync` once with
  `resolve(cwd, ".uf/progress/<sanitizeSlug(branch)>/uf.unleash.json")` mode 0o600 (parse the JSON string argument for the
  ProgressState shape); `mkdirSync` recursive+0o700; prompt composition via `calls.prompts[0].body.parts[0].text`; an empty GitExec
  calls array proves no-checkpoint-on-failure/omission (exec runs only for checkpoint_step on a verified-success run).
- Harness: an `invokeTool<T>` helper parses tool JSON output into a typed ToolResult discriminated union; separate Error vs non-Error
  throw-path cases; `vi.useFakeTimers` in try/finally for polling loops; the invocation context supplies all four fields the tool reads
  (sessionID, messageID, directory, abort) — cast the `tool()` return to `{execute: (args, ctx) => Promise<{output}>}` with a real
  AbortController signal for cancellation tests.
- Fakes distinguishing explicitly-passed `undefined` from an absent key use an `"in"` operator check
  (`"hostVariant" in options ? options.hostVariant : "default"`) — `??` or `||` defaults erase the distinction.

### Fixture discipline

- Every artifact fixture must carry the scenario's branch: dispatch filtering uses `rev-parse --abbrev-ref HEAD` and `artifactJson`
  defaults the envelope `context.branch`, so a fixture built for the default opsx branch while the fake GitExec reports a speckit
  branch is silently filtered with no error — masquerading as a derivation bug while being correct mode/branch filtering.
- Envelope timestamps are RFC3339 strings (`dependencies.now().toISOString()` in `envelopeFor`), so `Date.parse(string)` is correct;
  numeric epoch-ms would hit the epoch-0 fail-safe fallback (never produced in practice).
- Path-match mocks rather than counting calls: readState runs twice per invocation (reconcile, then recordAutoCheckpoint) and lstatSync
  three times (state file x2, progress dir before mkdirSync). Fake `fileExists` keys on absolute paths (`resolve(cwd, ...)` results),
  proving cwd confinement; after removals, grep tests for deleted identifiers to purge stale fixture metadata.

### Structural pinning

- Pins must be structural, not disciplinary: centralize CRLF normalization inside or directly beside the shared matcher
  (`matchTaskLine`) so one pin covers every current and future consumer; per-consumer normalization drifts (CS-004 pushes the same
  direction). Enumerate pin sites mechanically — grep `matchTaskLine` call sites — rather than trusting the fix's own test file.
- Assert computed counts, not absence of failure: `unchecked_count === N` and `step_statuses.implement === false` on a CRLF fixture
  with open tasks; a missing `\r` strip fails as a false implement-complete (count 0 is indistinguishable from genuinely complete —
  `null` is the missing-file signal), never an error. `countUncheckedCheckboxes` remains unexported by design; its only access path is
  `createUnleashDetectResumeTool` via the resume suite's `invokeDetectResume`/`fakeDeps` harness.
- Single-sourcing refactors (WORKFLOW_TIERS) must grep member literals before claiming "cannot drift": a sibling hand-maintained
  `z.enum` whose parsed value only feeds literal comparisons is invisible to derived-type protection; addition and rename drift
  silently.
- Command-prose pins: pin the tool name AND parameter block (`change_name`, `review_verdicts`, `learnings_stored` for
  write_unleash_summary vs the deprecated 3-argument persist_unleash_summary) — a bare tool-name Contains assertion passes a
  stale-signature call. Pin explicit spans ("Then persist the summary" to "## Guardrails") and mechanically checkable scenario counts
  (ceremony blockquotes 15 to 2); scaffold drift tests enforce byte-identity between `.opencode/commands/` and
  `internal/scaffold/assets/`, so one embedded assertion pins both.

### Family test-pattern sets

- A new member of a tool family sharing a mutation/failure primitive (recordAutoCheckpoint fail-closed catch-alls, corrupt-read outer
  catch-alls) must copy the family's complete test-pattern set: happy path, contract pins, fail-closed catch-all. The newest member is
  the one systematically skipped because existing family tests create a false impression of coverage — enumerate every member's
  catch-all error literal and grep the test tree for each before approving.

### CRLF and byte-offset discipline

- Shared line-grammar regexes with `$` anchors reject CRLF lines: in JavaScript `.` excludes `\r` and `$` without the `m` flag matches
  only end-of-input, so a line ending in `\r` never matches. Normalize at one point (inside the shared matcher).
- Keep byte-offset arithmetic on raw line lengths: `findTaskLine` strips the trailing `\r` for matching but accumulates `lineStart`
  from `rawLine.length + 1`, so the flip offset (`lineStart + 3`, covering `- [ ]`'s space byte) stays byte-correct — the flip point
  precedes any carriage return. Pin a single-byte flip: same total length, exactly one differing byte index.
- Derive CRLF fixtures from LF fixtures via `content.split("\n").join("\r\n")` (derivation guarantees content parity), complemented by
  a CRLF-complete fixture asserting count 0 / implement true to prove CRLF neither under- nor over-counts.

## History

- 2026-10-11/12: uf-finale establishes the DI plugin-testing pattern (GitExec/cwd injection, `node:child_process` partial mocks,
  invokeTool helper, security edge cases) — 572 tests across 23 files, 85%+ branch coverage.
- 2026-10-15: the `node:fs` mock surface extends the pattern to auto-checkpoint tools; unleash-delegate composes fakeClient with
  DelegateCommandDependencies to drive real delegation, timeout, and cancellation behavior.
- 2026-10-16: CRLF defect — parseTasksText and countUncheckedCheckboxes stripped a trailing `\r` but findTaskLine did not, so
  mark_task_complete returned TASK_NOT_FOUND on CRLF tasks.md files that parse_tasks and detect_resume accepted, violating the
  documented "the two tools cannot disagree about what counts as a task" invariant (round-2 council 6f909849, artifact 8601976b; HIGH).
- Pin decay: the round-2 fix pinned only the consumer it repaired (findTaskLine); the count consumer's pin was missed because the
  resume suite's fixtures happened to be LF-only, surfacing as maintainer feedback item 11 (MEDIUM, /uf.address-feedback on PR 745) — a
  discipline-dependent, per-consumer prescription. Resolved structurally: matchTaskLine centralization, computed-count pins through the
  resume harness, CRLF-from-LF fixture derivation.
- Contract evolution: the #707 write_unleash_summary → uf_finale_pr_context.unleashSummary field agreement
  (whatWasBuilt/howToVerify/testResults) was initially verified only by JSDoc inspection; two-sided pinning with unrelated fixtures
  leaves field-name agreement unguarded (a writer rename committed with its own test update keeps every suite green while downstream
  reads undefined). Closed with an executable connecting test in uf-finale.test.ts feeding the writer's actual output into the reader
  and asserting the consumed fields populate. Grammar-disagreement tests follow the same lesson: route every CRLF fixture through all
  consumers of the shared grammar (parse, count, mark).
- 2026-10-17: family catch-all enumeration, mechanical site enumeration, and enum single-sourcing generalize the structural lesson;
  2026-10-22 adds the "in"-operator refinement for presence/absence assertions in fakes.
