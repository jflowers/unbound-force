# Design: Fix review-pr Step 7 verdict-posting gate

status:: complete

## Context

Step 7 of `/uf.review-pr` currently reads:

```
After presenting the review, if there are findings with
severity HIGH or above, offer to post them as a formal
GitHub review on the PR:
```

This single condition gates the entire block, including:
1. Framing text listing HIGH+ finding counts
2. The `AskUserQuestion` offering Post/Skip

The framing text references HIGH+ counts and only makes sense
when such findings exist. The `AskUserQuestion`, however,
should always execute -- the user should always be offered to
post the review, even for APPROVE with zero findings.

## Goals

- G1: Always offer verdict posting via `AskUserQuestion`
- G2: Keep HIGH+ framing text conditional on HIGH+ findings
- G3: Minimal change footprint within Step 7

### Non-Goals

- Changing the `AskUserQuestion` options or wording (DD-2)
- Adding alternative framing text for non-HIGH scenarios (DD-3)
- Modifying any step other than Step 7

## Design decisions

### DD-1: Split Step 7 into two conditional blocks

**Decision**: Restructure Step 7 so the framing text and the
`AskUserQuestion` are independent blocks with different
conditions.

**Rationale**: The framing text ("I found N findings (X
CRITICAL, Y HIGH)") is semantically tied to HIGH+ findings.
The posting offer is a workflow gate that must always fire.
Splitting them preserves both behaviors.

**Structure**:

```
Step 7: Post Review

If there are findings with severity HIGH or above:
  [framing text with finding counts]

[AskUserQuestion - always executes]
  - Post as GitHub review
  - Skip posting
```

### DD-2: No new options or behavior changes

**Decision**: The `AskUserQuestion` options remain exactly as
they are today. No new choices, no changed wording.

**Rationale**: The bug is a gating issue, not a UX issue. The
existing options correctly cover all cases.

### DD-3: Framing text for non-HIGH scenarios

**Decision**: When no HIGH+ findings exist, omit the framing
text entirely rather than adding alternative framing.

**Rationale**: The `AskUserQuestion` is self-explanatory. The
review summary was already presented in Step 6. Adding
alternative framing text would be scope creep.

## Risks

- **R1**: Agents may interpret the restructured Step 7
  differently. **Mitigation**: The instruction text is
  explicit about when each sub-block executes.
- **R2**: Testing is manual (agent command execution).
  **Mitigation**: Agent command files (.md) are not executable
  code and cannot be unit-tested. Verification is performed by
  manual execution against PRs with known finding distributions.
  Pass/fail criteria: the agent output must include the
  AskUserQuestion prompt text. The small scope (~15 lines) and
  direct observability make manual verification acceptable.
