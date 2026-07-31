## Why

The `gaze-test-generator` agent (`.opencode/agents/gaze-test-generator.md`)
contains a compile verification rule at line 240/276: "ALWAYS verify
generated code compiles before reporting success." This is advisory
prose only -- there is no concrete tool call sequence specified, no
gate enforcement, and no instruction to halt before writing if
compilation fails.

This is a T3 weakness (required verification step is inline text
only, not enforced as a concrete tool call). Under context
compression or fast-path reasoning, an agent can skip compilation
checking entirely and write test files that do not compile.

The parent audit (unbound-force/unbound-force#346) identified this
pattern across multiple agent files. The gaze-test-generator is the
most impactful instance because it generates code that is written
to disk via the Write tool -- writing non-compiling tests is worse
than skipping the check for a read-only report.

Fixes: unbound-force/gaze#204

## What Changes

Harden the `gaze-test-generator` agent to enforce compile
verification as a concrete, mandatory gate before any Write tool
call. The advisory prose "ALWAYS verify generated code compiles"
is replaced with an explicit pre-write protocol specifying exact
tool calls and halt conditions.

## Capabilities

### New Capabilities
- `compile-gate`: Mandatory compile verification gate before any
  Write tool call in the gaze-test-generator agent. Specifies the
  exact bash command, failure behavior, and halt condition.

### Modified Capabilities
- `gaze-test-generator`: The "Important Constraints" and "Output
  Format" sections are updated to include the concrete compile-gate
  protocol instead of advisory prose.

### Removed Capabilities
- None

## Impact

- **Files**: `internal/scaffold/.opencode/agents/gaze-test-generator.md`
  (canonical scaffold copy -- primary modification target),
  `.opencode/agents/gaze-test-generator.md` (active runtime copy),
  `cmd/unbound-force/.opencode/agents/gaze-test-generator.md`
  (embedded copy)
- **Existing drift**: The active copy (242 lines) is an older
  version of the scaffold copy (278 lines). It is missing the
  `verify` action section and has a different scaffolded-by
  marker. This change resolves the drift by syncing the active
  copy to match the scaffold copy after applying the compile
  gate modifications.
- **Behavior**: The agent will now be instructed to run `go build`
  before writing files and to halt (not write) if compilation
  fails. This may cause the agent to report more errors instead
  of silently writing broken tests.
- **Drift detection**: The existing drift detection tests in
  `internal/scaffold/` do not cover the gaze-test-generator
  agent file (it is listed in `knownNonEmbeddedFiles`). A manual
  diff verification step is included in the tasks.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies an agent's internal instruction set. It does
not affect artifact-based communication between heroes or
inter-hero protocols. The gaze-test-generator continues to consume
gaze quality JSON artifacts and produce test files independently.

### II. Composability First

**Assessment**: PASS

The compile-gate uses `go build ./...`, which is universally
available in any Go project. No new dependencies are introduced.
The gaze-test-generator remains independently usable on any Go
project.

### III. Observable Quality

**Assessment**: PASS

The compile-gate adds a concrete verification step that produces
observable, machine-parseable output (go build exit code and error
output). This strengthens quality observability -- compilation
status was previously unverified advisory text.

### IV. Testability

**Assessment**: PASS

The change enforces verification of observable side effects (does
the generated code compile?) before writing. This directly aligns
with the testability principle's requirement that "test contracts
MUST verify observable side effects."

### V. Security by Default

**Assessment**: N/A

This change does not introduce dependencies, modify file
permissions, handle external inputs, or alter privilege boundaries.
