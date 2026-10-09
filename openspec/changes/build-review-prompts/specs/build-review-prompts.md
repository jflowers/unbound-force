## ADDED Requirements

### Requirement: FR-001 build_review_prompts tool

The review-dispatch plugin MUST register a
`build_review_prompts` tool that deterministically assembles
one self-contained prompt file per requested Divisor agent.

### Requirement: FR-002 Input schema

The tool MUST accept the following input parameters:

- `agents` (string array, required): Agent names to build
  prompts for. Each name MUST match the pattern
  `^divisor-[a-z0-9-]+$`.
- `mode` (string, required): Review mode. MUST be one of
  `code` or `specs`.
- `command` (string, required): Calling command name. MUST
  be one of `review-council`, `review-pr`, `triage-issue`,
  `address-feedback`.
- `diff_path` (string, required): Absolute path to the
  saved diff file on disk. The tool MUST read the diff
  content from this path.
- `changed_files` (string, required): Pre-formatted list
  of changed file paths with addition/deletion counts.
- `input_context` (string, required): Serialized
  base/head ref information (branch names, SHAs).
- `pre_flight_results` (string, optional): Formatted
  pre-flight check output.
- `sibling_evidence` (string, optional): Delimited
  sibling evidence block with provenance markers.
- `existing_reviews` (string, optional): Existing review
  state (comments, reviews) within a token budget.
- `walkthrough` (string, optional): PR walkthrough text.
- `review_context` (string, optional): Spec artifacts,
  linked issues, or other review context.

#### Scenario: Minimal required inputs

- **GIVEN** a valid `agents` array, `mode`, `command`,
  `diff_path`, `changed_files`, and `input_context`
- **WHEN** `build_review_prompts` is called with only
  required fields
- **THEN** the tool produces one prompt file per agent
  containing all 11 required sections, with optional
  sections omitted or empty-marked

#### Scenario: All optional inputs provided

- **GIVEN** all required and optional inputs are provided
- **WHEN** `build_review_prompts` is called
- **THEN** each prompt file includes pre-flight results,
  sibling evidence, existing reviews, walkthrough, and
  review context in their designated sections

### Requirement: FR-003 Output schema

The tool MUST return a JSON object with shape:
```
{
  prompts: Array<{
    agent: string,
    path: string,
    size_bytes: number
  }>
}
```

The `prompts` array MUST contain one entry per requested
agent, in the same order as the input `agents` array.
Each `path` MUST be an absolute path to a readable file
on disk. Each `size_bytes` MUST be the UTF-8 byte length
of the written file.

#### Scenario: Output matches input agent count

- **GIVEN** `agents` contains 5 agent names
- **WHEN** `build_review_prompts` succeeds
- **THEN** `prompts` contains exactly 5 entries, one per
  agent, in the same order

### Requirement: FR-004 Prompt template structure

Each generated prompt file MUST contain these 11 sections
in order:

1. **Step 0 instruction**: An instruction to read the
   agent's own definition file at
   `.opencode/agents/{agent}.md` before conducting the
   review.
2. **Persona role**: The agent's role description and
   mode-specific focus. The tool MUST read the agent
   definition file from `.opencode/agents/{agent}.md` and
   include its full content.
3. **Diff**: The complete immutable diff content, read
   from `diff_path`.
4. **Changed paths and input context**: The `changed_files`
   and `input_context` content verbatim.
5. **Project context**: The contents of `AGENTS.md` (read
   from disk), the constitution (read from
   `.specify/memory/constitution.md`), all convention pack
   files discovered from `.opencode/uf/packs/`, and the
   severity pack (read from
   `.opencode/uf/packs/severity.md`).
6. **Review evidence**: `pre_flight_results` and
   `review_context` content when provided.
7. **Existing review state**: `existing_reviews` content
   when provided.
8. **Sibling evidence**: `sibling_evidence` content when
   provided, with provenance delimiters preserved.
9. **Confinement rule**: Static text restricting findings
   to changed lines and their downstream impact.
10. **Prohibitions**: Static text prohibiting issue
    creation, tool changes, permission changes, repository
    scope changes, and file scope changes.
11. **Response contract**: Static text specifying the
    required response format: findings with severity,
    category, description, root_cause, file, line; model
    self-report; verdict; and optional lesson proposal.

#### Scenario: Agent definition file included

- **GIVEN** `.opencode/agents/divisor-guard.md` exists
  with content "Guard persona definition..."
- **WHEN** `build_review_prompts` is called with
  `agents: ["divisor-guard"]`
- **THEN** the prompt file for `divisor-guard` contains
  the full content of `divisor-guard.md`

#### Scenario: Convention packs discovered from disk

- **GIVEN** `.opencode/uf/packs/` contains `default.md`,
  `go.md`, and `severity.md`
- **WHEN** `build_review_prompts` is called
- **THEN** each prompt file contains the contents of all
  three pack files

#### Scenario: Missing agent definition file

- **GIVEN** `.opencode/agents/divisor-unknown.md` does
  not exist
- **WHEN** `build_review_prompts` is called with
  `agents: ["divisor-unknown"]`
- **THEN** the tool SHOULD produce the prompt with an
  empty persona section and a warning in the output,
  rather than failing entirely

### Requirement: FR-005 File I/O dependencies

The tool MUST read the following files from disk without
agent involvement:

- `.opencode/agents/{agent}.md` for each requested agent
- `AGENTS.md` from the project root
- `.specify/memory/constitution.md`
- All `*.md` files in `.opencode/uf/packs/`
- The diff file at the provided `diff_path`

File reads MUST use the existing `readText` dependency
pattern from the review-dispatch plugin. The tool MUST
NOT require the agent to read and pass these files.

#### Scenario: Project without convention packs

- **GIVEN** `.opencode/uf/packs/` does not exist
- **WHEN** `build_review_prompts` is called
- **THEN** the tool produces prompts without convention
  pack content and does not fail

### Requirement: FR-006 Prompt file output location

When a dispatch session exists (correlation_id resolved
from `sessionCorrelationMap` for the current session), the
tool MUST write prompt files to
`<dispatch-session-dir>/prompts/{agent}.md`.

When no dispatch session exists, the tool MUST write
prompt files to a new temporary directory under
`$TMPDIR/opencode/prompts-<uuid>/`.

The tool MUST create the output directory if it does not
exist.

#### Scenario: Dispatch session exists

- **GIVEN** a prior `dispatch_agent_run` call established
  a correlation_id for this session
- **WHEN** `build_review_prompts` is called
- **THEN** prompt files are written under the dispatch
  session directory at `prompts/{agent}.md`

#### Scenario: No dispatch session

- **GIVEN** no prior `dispatch_agent_run` call in this
  session
- **WHEN** `build_review_prompts` is called
- **THEN** prompt files are written to a new temp
  directory

### Requirement: FR-007 Dual-copy sync

The tool implementation MUST be maintained in both
`.opencode/plugins/review-dispatch/index.ts` and
`internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`.
Both copies MUST be byte-identical.

### Requirement: FR-008 Tool registration

The tool MUST be registered in
`ReviewDispatchPlugin.server()` alongside existing tools.
The total tool count MUST increase from 9 to 10.

#### Scenario: Plugin registration

- **GIVEN** the review-dispatch plugin is initialized
- **WHEN** the plugin's tool list is inspected
- **THEN** `build_review_prompts` appears in the
  registered tools

### Requirement: FR-009 Error handling

The tool MUST return a structured error result when:

- `diff_path` does not exist or is not readable
- No agents are provided (empty array)
- An agent name does not match the required pattern

The tool SHOULD NOT fail entirely when optional project
files are missing (AGENTS.md, constitution, packs). It
SHOULD produce prompts with those sections empty and
include warnings in the output.

#### Scenario: Diff file not found

- **GIVEN** `diff_path` points to a non-existent file
- **WHEN** `build_review_prompts` is called
- **THEN** the tool returns a failed result with error
  code `diff_read_failed` and a sanitized error message

### Requirement: FR-010 Response contract content

The static response contract section MUST instruct child
agents to:

- Use `submit_review_findings` to submit structured
  findings with severity, category, description,
  root_cause, file, and line
- Use `submit_lesson_proposal` to submit lesson proposals
  with information, tag, and optional category
- Include `**Model**: <family>` self-report in their
  text response
- Include one of the native verdict values in their
  text response

#### Scenario: Response contract mentions tool calls

- **GIVEN** a prompt file is generated
- **WHEN** the response contract section is inspected
- **THEN** it references `submit_review_findings` and
  `submit_lesson_proposal` by name

## MODIFIED Requirements

### Requirement: Command file prompt construction

Previously: Each command file (`uf.review-council`,
`uf.review-pr`, `uf.triage-issue`, `uf.address-feedback`)
contained ~100-150 lines describing how to construct child
prompt files, including section ordering, file reads, and
content assembly.

Modified: Command files SHOULD reference
`build_review_prompts` for prompt assembly. The command
file retains responsibility for gathering review context
(diff, CI checks, pre-flight, sibling evidence) and
passing it to the tool. The 11-section specification in
command files becomes a reference to the tool's template
rather than inline prose.

Note: Command file updates are a separate change. This
spec defines the tool; command file migration is tracked
independently.

## REMOVED Requirements

None.
