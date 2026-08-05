# Proposal: Fix review-pr Step 7 verdict-posting gate

status:: complete

## Why

`/uf.review-pr` Step 7 never offers to post the review as a
GitHub review when no HIGH+ findings exist. The condition "if
there are findings with severity HIGH or above" gates the
**entire** Step 7 block, including the `AskUserQuestion` that
offers verdict posting. When a review produces only MEDIUM/LOW
findings -- or no findings at all with an APPROVE verdict --
the user is never asked whether to post, and the review ends
silently after the summary.

This was reported in GitHub issue #441.

## What Changes

Restructure Step 7 so the HIGH+ severity condition gates only
the introductory framing text (the "I found N findings"
paragraph), while the `AskUserQuestion` offering to post the
review always executes regardless of finding severities.

## Capabilities

### Modified Capabilities

- **CAP-1**: The user is always offered to post the review as
  a GitHub review, regardless of finding severity distribution.
- **CAP-2**: The introductory framing text ("I found N findings
  (X CRITICAL, Y HIGH)") only appears when HIGH+ findings
  exist, preserving the current contextual framing.

### Unchanged Capabilities

- **CAP-3**: The existing `AskUserQuestion` options (Post as
  review / Skip posting) remain unchanged.

## Impact

- **Files**: `.opencode/commands/uf.review-pr.md` (Step 7 only)
- **Scope**: Single file, ~15 lines modified
- **Risk**: Low -- restructuring conditional flow within one
  step of one command
- **Breaking changes**: None

## Constitution Alignment

- **I. Autonomous Collaboration**: Preserves the human-in-the-
  loop confirmation gate before posting reviews to GitHub.
- **II. Composability First**: N/A -- no inter-hero
  dependencies affected.
- **III. Observable Quality**: Ensures the review workflow
  completes its full lifecycle rather than silently dropping
  the posting step.
- **IV. Testability**: N/A -- the changed file is an agent
  command (Markdown instructions), not executable code.
  Verification is manual per design decision R2.
- **V. Security by Default**: N/A -- no new inputs, no
  dependency changes, no privilege changes.
