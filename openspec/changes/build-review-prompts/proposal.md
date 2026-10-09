## Why

Orchestrator agents spend 60-90 seconds of reasoning time per
review session constructing child prompt files for Divisor
agents. Session `ses_ee1d6ca1` shows 75.1s of reasoning on
prompt file assembly alone, plus a macOS bash 3 failure on
`declare -A`, a retry, and 8 individual file reads (~50K chars)
for agent definitions and convention packs — all of which get
embedded into the prompt files the agent is building anyway.

The prompt content is 100% deterministic. Every command file
(`uf.review-council`, `uf.review-pr`, `uf.triage-issue`,
`uf.address-feedback`) specifies the same 11 required prompt
sections. The agent reads each section from disk, reasons about
how to combine them, builds a bash heredoc or multi-Write
sequence, and produces identical-structure files every time.

Moving this to a plugin tool eliminates:
- 75s reasoning per session (prompt assembly)
- 8+ file reads (agent defs, convention packs, AGENTS.md)
- shell compatibility failures (macOS bash 3 vs bash 4+)
- 3x diff re-reads (180K chars of redundant context)
- context pressure leading to 5+ compressions per session

## What Changes

A new `build_review_prompts` tool in the `review-dispatch`
plugin that deterministically assembles self-contained prompt
files for each included Divisor agent run.

## Capabilities

### New Capabilities
- `build_review_prompts`: Accepts review context (diff path,
  PR metadata, pre-flight results, sibling evidence, existing
  reviews, walkthrough) plus plan entries. Reads agent
  definition files, convention packs, AGENTS.md, constitution,
  and severity pack from disk. Produces one self-contained
  prompt file per included agent in a temp directory. Returns
  `{ prompts: [{ agent, path, size_bytes }] }`.

### Modified Capabilities
- Command files (`uf.review-council`, `uf.triage-issue`,
  `uf.address-feedback`, `speckit-testreview`): Will replace
  prompt construction prose with a single
  `build_review_prompts` call in a subsequent change. This
  change defines and implements the tool only; command file
  migration is tracked independently.

### Removed Capabilities
- None. The tool is additive. Manual prompt construction
  remains possible but is no longer the primary path.

## Impact

- **Command files**: ~100-150 lines of prompt construction
  prose replaced per command by a single tool call.
- **review-dispatch plugin**: New tool registered alongside
  existing 9 tools (10 total).
- **Template constants**: Static prompt template constants
  inline in `review-dispatch/index.ts` (per design D1).
- **Dual-copy sync**: Both `.opencode/plugins/` and
  `internal/scaffold/assets/opencode/plugins/` copies.
- **Tests**: New test file for the tool + updated smoke and
  integration tests for tool count.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The tool produces self-contained prompt files — each file is a
complete artifact that a Divisor agent can consume without
synchronous interaction with the orchestrator. This strengthens
artifact-based communication by making prompt structure
deterministic and reproducible.

### II. Composability First

**Assessment**: PASS

The tool is an optional accelerator within the review-dispatch
plugin. Commands can still construct prompts manually. The tool
has no mandatory dependencies beyond what the plugin already
imports (Node.js fs, path). Agent definitions and convention
packs are read from existing on-disk locations.

### III. Observable Quality

**Assessment**: PASS

The tool returns structured JSON output with per-prompt agent
name, file path, and byte size. Each prompt file is a readable
artifact on disk that can be inspected, diffed, or replayed.
Provenance metadata (base/head SHAs, changed files, sibling
evidence) is embedded verbatim in each prompt.

### IV. Testability

**Assessment**: PASS

The tool reads files from disk and writes files to a temp
directory. All I/O dependencies are injectable via the existing
`readText`/`readFile` patterns. Tests can provide fixture agent
definitions, convention packs, and diff content without
requiring external services or network access.

### V. Security by Default

**Assessment**: PASS

The tool validates `diff_path` against path traversal (FR-011),
encloses all caller-provided content in untrusted content
delimiters to mitigate prompt injection (FR-012), enforces
input size limits (FR-013), and writes output files with
restrictive permissions (FR-006: 0o700 dirs, 0o600 files).
Input validation is enforced by the Zod schema for agent name
patterns. The tool reads files from known project-relative
paths and the validated `diff_path`, applying least-privilege
I/O scope.
