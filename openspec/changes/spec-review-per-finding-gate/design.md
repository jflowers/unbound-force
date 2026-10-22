## Context

The spec review gates (Spec Review Mode in
`/uf.review-council`, cited by `/uf.unleash` Step 4)
currently offer two paths for a REQUEST CHANGES verdict:

- LOW/MEDIUM findings: one bulk consent gate that applies
  every trivial fix at once.
- Any HIGH/CRITICAL finding: a dead-stop exit
  (`format_unleash_exit` variant `spec-review`) that halts
  the pipeline until the human edits the spec manually.

Issue #777 asks for per-finding interactivity instead:
"please present each finding with options, a
recommendation, and with reasoning as text in the session
screen for an individual finding with the question tool
below presenting those options with a recommendation, then
repeat for each finding".

Scope confirmed with the user: all findings (any severity)
get the per-finding flow, with a bulk shortcut retained for
LOW/MEDIUM; the change is limited to the spec review gates
(Step 6 code review fix loop and the GitHub posting gate
are unchanged); each finding offers a 4-option set.

## Goals / Non-Goals

### Goals

- Replace the bulk consent gate and the HIGH/CRITICAL
  dead-stop with one per-finding decision protocol used by
  both `/uf.unleash` Step 4 and `/uf.review-council`.
- Let the human make quick, educated, per-finding choices
  with a visible recommendation and reasoning.
- Preserve every invariant: no autonomous progression past
  HIGH/CRITICAL, LOW/MEDIUM-only autonomous auto-fix
  policy, 3-iteration cap, session-resume guard, checkpoint
  iteration data, tool-rendered exits.

### Non-Goals

- No changes to the Step 6 code review fix loop (code fixes
  remain delegated without a human decision).
- No changes to the GitHub review posting gate (Step 7f).
- No plugin, template, or Go code changes: exits stay
  tool-rendered by the existing `format_unleash_exit`
  `spec-review` variant.
- No changes to severity definitions or the autonomous
  auto-fix policy in the severity pack.

## Decisions

### D1: Instruction prose + question tool, not a new tool

The per-finding protocol is judgment and human interaction,
which belongs in command prose per Constitution VI
(proposal alignment: principle VI PASS). No new plugin tool
is introduced; the question tool, `checkpoint`, and
`format_unleash_exit` compose the flow. The protocol's
normative text lives in the "Spec Review Mode" section of
`uf.review-council.md`; `/uf.unleash` Step 4 keeps citing
that section by name, preserving the existing ownership
split (review-council owns the protocol, unleash owns the
pipeline embedding).

### D2: Text above, question tool below (visibility)

Per the issue and the existing Step 7f VISIBILITY
DIRECTIVE precedent, each finding prints its details,
per-option reasoning, and recommendation as plain session
text, then the question tool presents the same options
below it. The recommended option is first and labeled
"(Recommended)". Findings are presented in severity order
(CRITICAL, HIGH, MEDIUM, LOW) so the most consequential
decisions come first.

### D3: Exact option labels

`"Apply suggested fix"`, `"Override & continue"`,
`"Show more context"`, `"Pause & exit"`, plus
`"Apply all remaining LOW/MEDIUM fixes"` only when the
current finding is LOW/MEDIUM. "Apply suggested fix" is
available for every severity because a human-directed fix
is a consented edit, not an autonomous auto-fix; the
severity pack gains a clarifying note (FR-007) so this
distinction is explicit. "Pause & exit" routes through the
existing tool-rendered `spec-review` exit — the exit path
is retained, only its trigger changes from "any
HIGH/CRITICAL finding" to "human chose pause".

### D4: Recommendation derivation is advisory

The command instructs the agent to reason per finding and
recommend one option with justification, as guidance only:
typically "Apply suggested fix" when the fix is clear and
low-risk, "Override & continue" when the finding is
advisory, out of scope, or the risk is accepted,
"Show more context" never (it is a navigation action), and
"Pause & exit" when fixing requires information the session
cannot supply. The human may always choose otherwise; the
recommendation carries no authority.

### D5: Override recording is durable and visible

Overrides are recorded with severity, description, and the
human's justification in the spec-review checkpoint data
and surfaced as final-report advisories (FR-004). This
keeps waived findings auditable (Constitution III:
observable quality) and survives compression.

### D6: Loop termination and re-review rules unchanged

After the loop, applied fixes trigger a re-run under the
existing rules (all included reviewers, single
sibling-evidence acquisition, iteration counter kept,
gate re-presents on REQUEST CHANGES). The 3-iteration cap
is unchanged; a fourth REQUEST CHANGES encounter exits
through the tool-rendered `spec-review` exit. This honors
the Gatekeeping Integrity rule: review iteration limits
are not modified.

### D7: Session-resume guard semantics

Decisions captured before compression or resume are
invalid; unresolved findings are re-presented with fresh
question-tool invocations. Resolutions recorded in durable
checkpoint data (applied fixes, overrides with
justifications) stand and are not re-asked. The checkpoint
data gains an overrides list alongside the iteration
counter.

### D8: Guardrail rewording in uf.unleash.md

- "The single exception is the spec auto-fix consent gate
  in Step 4" becomes "the single exception is the
  per-finding spec review decision gate in Step 4".
- "NEVER skip spec review exit on HIGH/CRITICAL" is
  reworded to preserve its intent: the pipeline MUST NOT
  proceed past a HIGH/CRITICAL finding without an explicit
  per-finding human choice; "Pause & exit" still routes
  through `format_unleash_exit`.
- The valid exit-reasons list changes "HIGH/CRITICAL spec
  findings" to "unresolved spec findings after the
  per-finding gate (pause choice or iteration cap)".

### D9: Mandatory gate markers wrap the protocol

The per-finding protocol is wrapped in the established
`>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<` /
`>>> END MANDATORY GATE <<<` markers with a session-resume
guard, matching the mandatory-gate-hardening convention and
keeping grep-based structural checks meaningful.

### D10: Mirrors and structural tests updated in lockstep

The live command/pack files and their
`internal/scaffold/assets/` mirrors are updated together;
`internal/scaffold/scaffold_test.go` structural assertions
are extended to cover the per-finding protocol (option
labels, marker presence, severity-order presentation,
no-autonomous-progression rule) so drift is caught by
`make check`.

## Risks / Trade-offs

- **More interactive steps slow large reviews.** Mitigated
  by the LOW/MEDIUM bulk shortcut and by severity ordering
  (the human can pause early if the top findings warrant
  it). The old bulk-only path is deliberately not kept as
  the default: issue #777 explicitly asks for per-finding
  presentation.
- **Recommendation quality depends on agent judgment.**
  The recommendation is advisory with no authority; the
  printed per-option reasoning makes the trade-offs
  inspectable even when the recommendation is weak.
- **Drift between canonical files and mirrors.** Existing
  risk, unchanged; the drift tests and extended structural
  assertions catch it in `make check`.
- **Higher per-finding question count could interact with
  session compression.** The session-resume guard
  (FR-006) makes mid-loop compression safe: unresolved
  findings are re-presented, durable resolutions stand.
