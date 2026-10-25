---
tier: validated
compiled_at: 2026-10-25T16:38:43Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - go-patterns-1
  - stdin-prompt-1
  - go-patterns-20260510T173314-jay-flowers
  - go-patterns-20260510T173319-jay-flowers
  - dry-refactoring-20261012T235618-jay-flowers
  - dry-extraction-20261015T161942-jay-flowers
topic: go-patterns
---

# Go Patterns

## Current State (October 2026)

### Input handling

- Interactive stdin prompts use `bufio.NewScanner(stdin)` with
  `scanner.Scan()` / `scanner.Text()`, never `fmt.Fscanln`. Fscanln is
  token-scanning, not line-oriented: on macOS (iTerm2) Enter can emit
  a bare CR (0x0D) Fscanln never recognizes, blocking indefinitely
  (stdin-prompt-1). ScanLines handles LF, CRLF, and bare CR; Text()
  strips the terminator; pair with strings.TrimSpace. Scan()
  returning false on piped EOF makes cancellation trivial
  (cmd/unbound-force/sandbox.go:276-285, D14); Scanner accepts any
  io.Reader, so tests inject strings.NewReader.
- KNOWN REMAINING VIOLATION: internal/sandbox/sandbox.go:793 (Extract
  patch-apply confirmation prompt) still calls fmt.Fscanln(opts.Stdin,
  ...). The convention-pack Fscanln ban was never adopted; no lint
  enforcement exists, so the call site is tracked by audit only.

### Injectability (function params, exec, constants/platform)

- Testability seams are plain function-typed fields, not wrapper
  interfaces: `refreshFn func() error` drives gateway token refresh
  (internal/gateway/refresh.go:32); exec injection is an UNNAMED func
  type `func(string, ...string) ([]byte, error)` (provider.go:181).
- runtime.GOOS is not overridable, so platform seams inject around
  it: `Options.GOOS string` falling back to runtime.GOOS when empty
  (doctor.go:73-88, setup.go), or `Platform *PlatformConfig`
  overriding auto-detection (sandbox.go:140); DetectPlatform
  (detect.go:13,36) takes injectable ExecCmd/ReadFile so tests
  simulate macOS on Linux CI.
- Verify partially-successful subprocesses by status, not stderr
  string-matching (messages drift across versions/locales): after
  `devpod up` fails, check `devpod status` JSON state; if the status
  command itself fails, propagate the original error
  (go-patterns-20260510).

### Options structs and constructors

- Options structs use optional pointer/empty-means-absent fields:
  `ScanInput{SourceStats *SourceStats}` (dewey sanitize.go:85,107,182).
  New Options fields break existing test struct literals — default-stub
  them at construction (setup.go:133-134 stubs ResolveRelease).
- Constructor migration `*T` -> `(*T, error)` is mechanical when
  callers already return `(T, error)` (newVertexProvider,
  provider.go:185-188); the compiler enumerates call sites as type
  errors. Test pattern: `prov, err := newFoo()` + t.Fatalf; name it
  provErr when the test needs err separately. Add tests for BOTH the
  new error path and the preserved success path (go-patterns-1).

### Error wrapping

- `fmt.Errorf("context: %w", err)` is pack CS-006 MUST
  (.opencode/uf/packs/go.md:17); context MUST name the failed
  operation. ~180 `%w` wraps across internal/ + cmd/ (audit count 179).

### DRY extraction discipline

- Extract at the third verbatim copy.
- After extraction ALL consumers — including tool wrappers — must
  delegate to the shared helper: uf-workflow kept a 50-line inlined
  normalizeModelName beside the extracted lib function until the
  architect reviewer caught it in iteration 2; fixed with a 3-line
  delegation (dry-refactoring-20261012).
- Before freezing a shared helper's return type, enumerate each
  consumer's output contract value-by-value: tasks MUST specify the
  mapping preserving legacy output shape and tests must assert
  previously-unasserted values — a four-valued classifyBranch
  passthrough would have silently changed uf-finale main-branch
  output from "other" to "main" while tests stayed green
  (dry-extraction-20261015). Reviewer check: diff the helper's
  return type vs the consumer's emitted shape; grep tests per field.

## History

- 2026-04-27: constructor `*T` -> `(*T, error)` codified (go-patterns-1).
- 2026-05-07/10: Fscanln bare-CR hang diagnosed (stdin-prompt-1),
  then reiterated as "fundamentally broken". Fixed only in
  cmd/unbound-force/sandbox.go:276-285 (D14); the Extract prompt at
  internal/sandbox/sandbox.go:793 predates the fix and remains the
  sole live call site. The drafted convention-pack Fscanln ban was
  never adopted — the pattern is convention, not enforcement.
- 2026-05-10: status-based devpod verification recorded.
- 2026-10-12/15: TypeScript DRY lessons (normalizeModelName
  delegation; branchType output contract) generalized into Go.
- Signature drift: older learning prose cites shapes that never
  existed or no longer do — ExecCommandFunc was never a real type;
  dewey's resolveAuthor now returns string only (learning.go:126).
  Trust Oct 2026 audit signatures over learning prose.
