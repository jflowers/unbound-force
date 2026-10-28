## Why

PR #792 introduced the per-finding spec review decision gate and,
with it, a presentation contract for the **question tool**
(`.opencode/commands/uf.review-council.md`):

1. Print the decision content as plain session text **above**
   the question tool (visibility directive — the printed text
   and the question tool MUST present the same details and
   options).
2. The printed text includes full details with context,
   per-option reasoning (what each choice does and when it
   fits), and a recommendation with justification (advisory
   only — the human decides).
3. Present the question tool below with the same options, the
   recommended option FIRST and labeled "(Recommended)".

The interactive gates in the three sibling commands still use
the older, weaker shape — "Inform the user … Use the question
tool with options […]" — giving the human a bare options list
with no printed-context guarantee, no per-option reasoning, and
no recommendation. Two gates let the human confirm posting
content they have not seen: `/uf.address-feedback` Section 4.5
asks whether to post composed reply comments without ever
printing them, and `/uf.triage-issue` Section 4.3's composed
comment has no explicit print-above guarantee.

These gates guard GitHub mutations (labels, comments, child
issues, commits, pushes, review posting). A bare options list
at those moments deprives the human of the decision support the
spec review gates already provide. Issue #850 tracks the
upgrade; issue #777 is the parent.

## What Changes

Upgrade every human-facing question gate in `/uf.triage-issue`,
`/uf.address-feedback`, and `/uf.review-pr` to the PR #792
presentation contract — 22 question-tool invocations total: 8 in
`/uf.triage-issue`, 6 in `/uf.address-feedback`, 8 in
`/uf.review-pr` (Step 8a's two mutually exclusive duplicate
detection branches counted separately).

Open-ended follow-ups (Modify/Reject/Ask text collection,
diff-focus file selection) keep their open-ended form; only the
surrounding presentation changes.

The change also extends the structural pin tests
(`TestSpecReviewPerFindingGateContracts` pattern in
`internal/scaffold/scaffold_test.go`) so the shared
presentation-contract fragments and the per-gate option
inventories are asserted in all three command assets — closing
the gap noted in #792's advisories that the presentation
contract is pinned only in prose, not in tests.

## Capabilities

### New Capabilities
- `question-tool-presentation`: the consolidated capability for
  the gate presentation contract, shipping the ADDED
  requirements (FR-001 through FR-012) as
  `specs/question-tool-presentation/spec.md`. No new interaction
  points or functionality are introduced — the requirements
  govern presentation at the existing question-tool gates.

### Modified Capabilities
- `uf.triage-issue`: all 8 question gates upgraded to the
  presentation contract
- `uf.address-feedback`: all 6 question gates upgraded to the
  presentation contract; composed reply comments are printed
  as session text before the posting question
- `uf.review-pr`: all 8 question gates upgraded to the
  presentation contract
- `scaffold-pin-tests`: new pin test asserting the shared
  presentation-contract fragments and gate option inventories
  across the three command assets

These modifications are specified via the consolidated
`question-tool-presentation` delta; no per-capability MODIFIED
deltas ship with this change.

### Removed Capabilities
- None

## Impact

**Files modified** (3 canonical commands + 3 scaffold mirrors +
1 test file):

- `.opencode/commands/uf.triage-issue.md`
- `.opencode/commands/uf.address-feedback.md`
- `.opencode/commands/uf.review-pr.md`
- `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`
- `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
- `internal/scaffold/assets/opencode/commands/uf.review-pr.md`
- `internal/scaffold/scaffold_test.go`

**Behavioral change**: presentation only. Every gate keeps its
safety semantics — the same option sets, the same blocking
rules, the same session-resume guards and MANDATORY GATE
markers. The only option-list changes are ordering (recommended
option first) and the "(Recommended)" label. No artifacts,
schemas, tool payloads, or dispatch protocols change.

**Out of scope** (known adjacent gaps from issue #850, left for
follow-up): The legacy bare-options presentation lives on at
multiple sites outside #850's inventory and is deferred to a
follow-up sweep. Confirmed sites (swept by grepping `question
tool`, `Use options:`, `**Options**:`, and backtick
option-array openers across `.opencode/commands` and
`.opencode/skills`, then reading each hit's context):
speckit.implement.md:40 and :149-151 (two occurrences),
speckit.clarify.md:138, speckit.specify.md:50-61,
opsx-propose.md:54-62, opsx-archive.md:82-88,
speckit-workflow/SKILL.md:40-51, and
openspec-archive-change/SKILL.md:94 and :137-139. Several are
mutation-consent gates (commit/push, stash, branch switch) of
exactly the class this change targets. This list is a floor,
not an exhaustive census; variant-shaped gates of the same
class may remain. `uf.review-council`'s own code-mode gates and
`uf.finale` remain separately acknowledged adjacent gaps.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies human-interaction prose in slash command
markdown files. No inter-hero artifact exchange, envelopes, or
hero interfaces are affected.

### II. Composability First

**Assessment**: N/A

No hero dependencies are introduced or modified. The three
commands remain independently usable; the question tool is a
built-in OpenCode capability, not a hero dependency.

### III. Observable Quality

**Assessment**: PASS

The normative claim "every question gate in the three commands
follows the presentation contract" is backed by automated,
reproducible evidence: the extended scaffold pin tests assert
the shared contract fragments and gate inventories in the
embedded command assets and run under `make check`.

### IV. Testability

**Assessment**: PASS

The pin tests extend the shipped
`TestSpecReviewPerFindingGateContracts` pattern
(`internal/scaffold/scaffold_test.go`) and are verifiable in
isolation via `go test ./internal/scaffold/...` with no
external services, network access, or shared state.

### V. Security by Default

**Assessment**: N/A

No supply chain, input validation, or privilege changes. The
human-consent semantics of every gate are preserved — no gate
is weakened, bypassed, or disabled; option sets are unchanged.

### VI. Deterministic Execution

**Assessment**: N/A

The presentation contract governs judgment — human decisions
and interaction — which Principle VI explicitly assigns to
instruction prose. No mechanical procedure is added to
commands; drift prevention is an executable, tested pin test
rather than behavioral prose guards.
