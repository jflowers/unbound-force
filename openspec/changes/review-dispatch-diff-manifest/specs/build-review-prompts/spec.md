<!-- capability: build-review-prompts
     change: review-dispatch-diff-manifest
     originating_issue: 877 -->

## MODIFIED Requirements

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
3. **Diff**: In inline delivery mode (diff at or below
   `DIFF_THRESHOLD`, 1500 lines), the complete immutable
   diff content, read from `diff_path`, enclosed in
   untrusted content delimiters per FR-012. In manifest
   delivery mode (diff strictly above the threshold), the
   `## Diff Manifest` section per the review-dispatch
   capability's RD-FR-035 — rendered manifest entries,
   retrieval instructions naming `read_diff_chunk`, the
   untrusted-content instruction, and the coverage
   attestation field — with the diff content NOT inlined
   into the prompt.
4. **Changed paths and input context**: The `changed_files`
   and `input_context` content verbatim.
5. **Project context**: The contents of `AGENTS.md` (read
   from disk), the constitution (read from
   `.specify/memory/constitution.md`), all convention pack
   files discovered from `.opencode/uf/packs/`, and the
   severity pack (read from
   `.opencode/uf/packs/severity.md`).
6. **Review evidence**: `pre_flight_results`,
   `review_context`, and `walkthrough` content when
   provided.
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
    self-report; verdict; and optional lesson proposal. In
    manifest mode the response contract additionally
    carries the coverage attestation field per RD-FR-035.

Previously: section 3 unconditionally inlined the complete
diff content in every prompt, and the response contract
carried no attestation field.

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

#### Scenario: Manifest mode replaces the Diff section

- **GIVEN** a diff strictly above `DIFF_THRESHOLD` (1500
  lines)
- **WHEN** `build_review_prompts` is called
- **THEN** section 3 of each prompt is the `## Diff
  Manifest` section per RD-FR-035
- **AND** no prompt inlines the diff content

### Requirement: FR-013 Input size limits

The tool MUST enforce a maximum total prompt file size
of 4 MiB (4,194,304 bytes) per agent in both delivery
modes. If assembling a prompt for an agent would exceed
this limit, the tool MUST return a structured error result
with error code `prompt_size_exceeded` for that agent,
including the calculated size and the limit.

Individual string inputs SHOULD be validated against
reasonable size bounds. The `diff_path` file size MUST
NOT exceed 2 MiB on the inline delivery path (diff at or
below `DIFF_THRESHOLD`): an oversized diff there MUST
return `prompt_size_exceeded`. In manifest delivery mode
(diff strictly above the threshold) the 2 MiB inline cap
does not apply; the tool reads the diff tool-side for
manifest construction bounded by the existing capture-side
write caps (8 MiB captured diff), and manifest-mode
prompts remain bounded by the 4 MiB prompt cap. Other
string inputs MUST NOT exceed 1 MiB each.

Previously: the 2 MiB `diff_path` cap applied
unconditionally, rejecting any oversized diff; with
manifest delivery an over-2 MiB (necessarily
over-threshold) diff becomes the feature path rather than
a hard failure.

#### Scenario: Oversized diff rejected on the inline path

- **GIVEN** `diff_path` points to a file larger than 2 MiB
  whose line count is at or below 1500 lines
- **WHEN** `build_review_prompts` is called
- **THEN** the tool returns a failed result with error
  code `prompt_size_exceeded`

#### Scenario: Oversized diff proceeds in manifest mode

- **GIVEN** `diff_path` points to a file larger than 2 MiB
  whose line count strictly exceeds 1500 lines
- **WHEN** `build_review_prompts` is called
- **THEN** the tool assembles manifest-mode prompts
- **AND** no `prompt_size_exceeded` rejection occurs for
  the diff size alone (the 4 MiB prompt cap still applies
  to each assembled prompt)
