## Context

Four command files (`uf.review-council`, `uf.review-pr`,
`uf.triage-issue`, `uf.address-feedback`) each describe
the same 11 required prompt sections in prose. The
orchestrator agent reads these sections from disk (agent
definitions, convention packs, AGENTS.md, constitution,
severity pack, diff, sibling evidence, pre-flight results)
and manually assembles them into per-agent prompt files
using bash heredocs or multi-Write sequences. This process
consumes 60-90s of reasoning time, 8+ file reads, and
frequently fails on macOS bash 3 compatibility.

The `review-dispatch` plugin already owns session lifecycle
(`dispatch_agent_run`), model resolution, finding
submission, consolidation, and finalization. Prompt
assembly is the remaining manual step in the dispatch
pipeline.

## Goals / Non-Goals

### Goals
- Deterministic prompt assembly via a single tool call
- Read agent definitions, convention packs, and shared
  context files from disk without agent involvement
- Produce one self-contained prompt file per included
  agent in a temp directory
- Support all four command workflows (review-council,
  review-pr, triage-issue, address-feedback) with a
  single tool
- Reduce per-session reasoning time by ~75s and context
  pressure by ~200K chars

### Non-Goals
- Replacing review context gathering (CI checks, diff
  fetch, pre-flight, sibling evidence) — commands still
  own this
- Replacing `dispatch_agent_run` or `consolidate_dispatch`
  — the tool only builds prompt files
- Supporting non-Divisor agent prompts (e.g., gaze-reporter,
  cobalt-crush-dev)
- Dynamic prompt content decisions (e.g., choosing which
  convention packs to load based on file types) — the
  caller specifies what to include

## Decisions

### D1: Tool lives in review-dispatch plugin

The tool joins the existing 9 tools in the review-dispatch
plugin rather than creating a new plugin or putting it in
invoke-agent. Rationale: prompt assembly is part of the
dispatch workflow, the plugin already has file I/O
dependencies, and it avoids a new plugin registration.

### D2: Caller provides context, tool provides structure

The agent gathers review context (diff path, PR metadata,
pre-flight results, sibling evidence, existing reviews,
walkthrough, review-context output) and passes it to the
tool. The tool reads files from disk (agent definitions,
convention packs, AGENTS.md, constitution, severity pack)
and assembles the prompt using a fixed template.

This keeps the tool stateless and testable — it receives
all variable inputs as parameters and reads only stable
project files from disk.

### D3: Template structure matches command file spec

The prompt template implements the 11 required sections
from the command files:

1. Persona role and mode-specific focus (from agent def)
2. Complete immutable diff (from diff_path)
3. All changed paths and exact base/head input context
4. AGENTS.md, constitution, active convention packs,
   severity
5. Review-context and pre-flight evidence
6. Existing review state (within token budget)
7. Identical delimited sibling evidence with provenance
8. Changed-line and downstream-impact confinement rule
9. Prohibition on issue creation and scope changes
10. Structured response contract (findings + verdict)
11. Step 0: read own agent definition file instruction

Sections 8-10 are static text baked into the template.
Section 11 is agent-name-parameterized.

### D4: Convention packs discovered from disk

The tool reads `.opencode/uf/packs/` directory listing
and includes all `*.md` files found, rather than requiring
the caller to enumerate them. This matches the current
command file behavior and avoids staleness when packs are
added or removed.

### D5: Output to temp directory under dispatch session

Prompt files are written to
`<dispatch-session-dir>/prompts/<agent>.md` when a
dispatch session exists (correlation_id resolved from
session map), or to `$TMPDIR/opencode/prompts-<uuid>/`
for ad-hoc use. The tool creates the directory if needed.

### D6: Input schema uses flat string fields for context

Rather than deeply nested objects, the tool accepts
context sections as pre-formatted strings or file paths:

- `diff_path: string` — path to saved diff file on disk
- `changed_files: string` — formatted changed-file list
- `input_context: string` — serialized base/head refs
- `pre_flight_results: string` — formatted pre-flight
  output (optional)
- `sibling_evidence: string` — delimited evidence block
- `existing_reviews: string` — formatted review state
  (optional)
- `walkthrough: string` — PR walkthrough (optional)
- `review_context: string` — spec/issue context (optional)
- `mode: string` — "code" or "specs"
- `command: string` — which command is calling
- `agents: string[]` — agent names to build prompts for

This keeps the schema simple and avoids duplicating
complex nested types that already exist in the command
file context. The agent has these strings ready from its
earlier steps.

### D7: Response contract embedded as static template

The structured response contract (findings with severity,
category, description, root_cause, file, line; plus
verdict and model self-report) is a fixed text block in
the tool's source. It matches the `submit_review_findings`
and `submit_lesson_proposal` tool schemas so child agents
produce compatible output.

## Risks / Trade-offs

### R1: Template drift from command file prose

If command files add new required prompt sections, the tool
template must be updated in sync. Mitigated by: the tool
is the authoritative template source — command files
reference the tool rather than duplicating the spec.

### R2: Large prompt files may approach 4 MiB limit

With full convention packs, AGENTS.md, diff, and sibling
evidence, individual prompt files can reach 500-600 KB.
The current `MAX_PROMPT_FILE_BYTES` is 4 MiB, providing
adequate headroom. Monitored via the returned `size_bytes`.

### R3: Agent definition format changes

The tool reads agent `.md` files and includes their full
content. If agent file format changes (e.g., structured
YAML frontmatter), the tool's reading logic must adapt.
Mitigated by: agent files are plain markdown with no
complex parsing required.

### R4: Testability of prompt content

Testing exact prompt content is brittle. Tests should
verify structural properties (section headers present,
agent name substituted, diff included, file size > 0)
rather than exact text matching.
