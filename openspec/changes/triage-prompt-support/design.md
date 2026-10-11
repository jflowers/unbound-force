## Context

`dispatch_review_runs` and `build_review_prompts` were designed
exclusively for diff-based code review. The prompt assembly
function unconditionally reads a diff file, emits `## Diff` and
`## Changed Files` sections, applies a confinement rule
referencing "lines added or modified in the diff," and requires
APPROVE / REQUEST CHANGES verdicts.

Issue triage (`/uf.triage-issue`) has no diff. Its primary input
is the issue content (title, body, comments). Its verdicts are
VALID / INVALID / NEEDS-CLARIFICATION. The existing schemas
reject triage calls at parse time because `diff_path` and
`changed_files` are required fields.

The planner (`plan_review_dispatch`) and consolidation
(`consolidate_dispatch`) layers are already triage-aware. Only
the prompt-assembly and dispatch-invocation layers need updating.

## Goals / Non-Goals

### Goals
- Make `build_review_prompts` produce correct child prompts for
  triage mode: issue content as primary input, triage-specific
  confinement rule, triage verdict vocabulary
- Make `dispatch_review_runs` accept triage calls without
  `diff_path` or `changed_files`
- Add `issue_content` field (JSON string) as the triage
  equivalent of the diff
- Maintain full backward compatibility for code/specs review
- Update `uf.triage-issue.md` command file to pass correct
  fields
- Cover all new paths with tests

### Non-Goals
- Modifying `plan_review_dispatch` (already triage-aware)
- Modifying `consolidate_dispatch` (already triage-aware)
- Modifying `finalize_review_dispatch` (already triage-aware)
- Modifying `fetch_pr_review_context` (PR-only tool)
- Supporting `address-feedback` mode (different scope)
- Changing the triage consensus algorithm

## Decisions

### D1: Conditional schema enforcement via superRefine

Make `diff_path`, `changed_files`, and `issue_content` optional
at the Zod level, then enforce mutual exclusivity in a
superRefine block keyed on `mode`:

- `mode !== "triage"`: require `diff_path` and `changed_files`;
  reject `issue_content`
- `mode === "triage"`: require `issue_content`; reject
  `diff_path` and `changed_files`

This mirrors the existing pattern in `plan_review_dispatch`
(PlanInputSchema lines 311-334) where `changed_files` and
`issue` have mode-dependent requirements.

**Rationale** (Composability First): The same tool serves both
code review and triage without mode-specific wrapper tools.
Callers pass the fields appropriate to their mode; the schema
validates correctness.

### D2: issue_content as JSON string

`issue_content` is a JSON string containing the issue's title,
body, comments, labels, state, and author association. This
matches the convention used by `input_context` (also a
serialized JSON string).

Shape:
```json
{
  "title": "string",
  "body": "string | null",
  "comments": [
    { "id": 123, "created_at": "ISO-8601", "body": "string" }
  ],
  "labels": ["string"],
  "state": "open",
  "author_association": "CONTRIBUTOR"
}
```

**Rationale** (Autonomous Collaboration): The prompt file is
self-contained — all issue data is embedded, no runtime fetch
needed during prompt assembly.

### D3: Mode branch in buildReviewPrompts

A single `isTriageMode` boolean controls five section switches:

| Section | Code review | Triage |
|---------|-------------|--------|
| 3 | `## Diff` (from file) | `## Issue Content` (from `issue_content`) |
| 4 | `## Changed Files and Input Context` | `## Input Context` |
| 9 | `CONFINEMENT_RULE` | `TRIAGE_CONFINEMENT_RULE` |
| 10 | `PROHIBITIONS` | `TRIAGE_PROHIBITIONS` |
| 11 | `RESPONSE_CONTRACT` | `TRIAGE_RESPONSE_CONTRACT` |

When `isTriageMode` is true, the function skips
`validateDiffPath()`, `readFile(diff_path)`, and the diff size
check.

**Rationale** (Observable Quality): Each mode gets a
purpose-built response contract with the correct verdict
vocabulary, ensuring machine-parseable output.

### D4: Three new static constants

- `TRIAGE_CONFINEMENT_RULE`: confines to issue content and
  repository context; no references to diffs or changed lines
- `TRIAGE_PROHIBITIONS`: removes diff-specific language, adds
  "do not create child issues or PRs"
- `TRIAGE_RESPONSE_CONTRACT`: requires VALID / INVALID /
  NEEDS-CLARIFICATION verdicts plus category, objectivity,
  reasoning, and split_recommendation fields

All three are compile-time string constants, consistent with
the existing `CONFINEMENT_RULE`, `PROHIBITIONS`, and
`RESPONSE_CONTRACT`.

### D5: issue_content in UNTRUSTED_SECTION_NAMES

`issue_content` is added to the `UNTRUSTED_SECTION_NAMES`
array so it receives the same untrusted-evidence delimiter
treatment as `diff`, `changed_files`, and `review_context`.
This prevents prompt injection from issue content.

### D6: Scaffold dual-copy sync

Both canonical files are synced to their scaffold counterparts:
- `review-dispatch/index.ts` → scaffold copy
- `uf.triage-issue.md` → scaffold copy

This maintains the existing dual-copy invariant.

## Risks / Trade-offs

### R1: Section numbering fragility

The mode branch hardcodes section numbers (3, 4, 9, 10, 11).
If sections are reordered in the future, the triage branch
must be updated in tandem. Mitigated by the existing test
suite, which asserts section content by keyword rather than
position.

### R2: issue_content size

Issue bodies and comment threads can be large. No explicit
size cap is proposed for `issue_content` — the existing
prompt file size limit (4 MiB) provides a natural ceiling.
If triage prompts routinely approach this limit, a future
change could add truncation with a "comments truncated"
marker.

### R3: address-feedback mode not covered

`address-feedback` has its own input shape (PR review
threads, not diffs or issues). This change does not add
feedback-mode support to `build_review_prompts`. That is
a separate scope item.
