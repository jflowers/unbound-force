## Why

During triage of issue #465 via `uf.triage-issue`, the agent
executed all Phase 4 mutations autonomously -- posting a triage
comment, creating 4 child issues, and writing an artifact -- all
without pausing for user confirmation. The root cause is that
Phase 4 is labeled "(Interactive)" but lacks an explicit
`>>> MANDATORY GATE <<<` marker. Other commands
(`uf.review-council` Step 7f, `uf.finale` Steps 2/5) use this
marker pattern successfully to enforce hard stops.

Additionally, the agent used `gh issue create`/`gh issue comment`
instead of the `gh api --input <tmpfile>` pattern, which is a
shell injection safety violation already covered by the command's
guardrails but not reiterated at the mutation boundary.

Severity: HIGH. Mutations without confirmation violate the
interactive contract and Principle V (Security by Default).

Fixes #473.

## What Changes

Add a mandatory gate block at the Phase 4 entry point in
`uf.triage-issue.md`. The gate follows the same proven pattern
used by `uf.review-council.md` and `uf.finale.md`:

1. `>>> MANDATORY GATE <<<` marker at Phase 4 entry
2. Compressed-context resume guard (re-read instructions)
3. Temp file + `--input` requirement reiterated at the
   mutation boundary
4. Phase 4.1 summary display required before any mutation

## Capabilities

### New Capabilities
- `mandatory-gate-phase-4`: Enforceable hard stop at the
  boundary between classification (Phase 3) and mutation
  (Phase 4) in the triage workflow

### Modified Capabilities
- `uf.triage-issue Phase 4`: Phase 4 entry now includes an
  explicit mandatory gate block that prevents autonomous
  execution of mutations

### Removed Capabilities
- None

## Impact

- **Files modified**: `.opencode/commands/uf.triage-issue.md`
  and `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`
  (kept in sync, identical content)
- **Behavioral change**: Agents executing `uf.triage-issue`
  will be required to stop at Phase 4 entry, display the
  triage summary, and obtain explicit user confirmation
  before proceeding to any mutation (labels, comments,
  child issues)
- **No breaking changes**: The command's external interface
  and output format are unchanged
- **No new dependencies**: Uses existing `question` tool
  pattern already available in the agent runtime

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies an interactive command workflow, not
inter-hero artifact communication. The triage artifact
(Phase 4.5) output format is unchanged.

### II. Composability First

**Assessment**: PASS

The change is self-contained within the `uf.triage-issue`
command. No other hero or command is affected. The command
remains independently usable.

### III. Observable Quality

**Assessment**: PASS

The triage summary (Phase 4.1) is displayed to the user
before mutations proceed, improving observability of the
agent's classification decisions before they become
irreversible GitHub state changes.

### IV. Testability

**Assessment**: N/A

This change modifies a Markdown command specification, not
executable code. The behavioral contract is verified by the
existing drift-detection test that ensures the scaffold
asset matches the deployed command file. The pipeline test
suite for `council-review-action` provides the pattern for
testing similar gate behaviors.

### V. Security by Default

**Assessment**: PASS

This change directly strengthens security: it prevents
agents from executing GitHub mutations (issue comments,
child issue creation) without user confirmation, and
reiterates the `gh api --input <tmpfile>` requirement at the
mutation boundary to prevent shell injection via
interpolated issue content.
