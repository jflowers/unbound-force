---
name: review-context
description: "Shared review context discovery for spec artifacts, path classification, and walkthrough generation."
---
<!-- scaffolded by uf vdev -->
# Skill: Review Context Discovery

Shared logic for discovering and loading review context
before a review command begins its analysis. Consuming
commands load this skill to standardize how spec
artifacts, path classifications, and walkthrough summaries
are discovered and formatted.

## Consumers

| Command | How it loads | Notes |
|---------|-------------|-------|
| `/uf.review-pr` | Skill tool | Replaces inline Steps 6-8 logic; Protocol 2 via standalone `acquire_intent_context` |
| `/uf.review-council` | Skill tool | Phase 1c — Protocols 1, 3, 4; Protocol 2 dispatch-owned (via `dispatch_review_runs`) |
| `/uf.address-feedback` | Skill tool | Replaces inline fallback; Protocol 2 via standalone `acquire_intent_context` (Tier 1 non-dispatch path) |

The consuming command specifies which protocols to
execute based on its path: dispatch consumers
(`uf.review-council`, `uf.unleash`) let the dispatch own
Protocol 2 acquisition, while non-dispatch consumers
(`uf.review-pr`, `uf.address-feedback` Tier 1) call
`acquire_intent_context` directly.

---

## Protocol 1: Spec Artifact Discovery

Locate the specification associated with the current
change. The discovery order is deterministic — stop at
the first match.

### Step 1: Branch name matching

Derive the spec directory from the current branch name
or PR branch name:

| Branch pattern | Spec location |
|---------------|---------------|
| `speckit/NNN-<name>` or `NNN-<name>` (legacy) | `specs/<name>/spec.md` (Speckit; strip `speckit/` prefix) |
| `opsx/<name>` | `openspec/changes/<name>/proposal.md` (OpenSpec changes) |
| `opsx/<name>` | `openspec/specs/<name>/spec.md` (OpenSpec specs) |

### Step 2: PR description parsing

If no spec is found via branch name and a PR description
is available, scan for explicit spec references (e.g.,
"See spec 012" or "Implements specs/012-swarm/spec.md" or "branch speckit/012-swarm").

### Step 3: Changed-file detection

If no spec is found via branch name or PR description,
check the changed file list for spec artifacts. The spec
may be introduced by the change itself. If found in
changed files, read the spec content from the diff
rather than from the filesystem.

### Step 4: Read relevant sections

When a spec is found, read only the sections relevant
to review to minimize token usage:

| Spec type | Sections to read |
|-----------|-----------------|
| Speckit | Functional Requirements, User Stories |
| OpenSpec proposal | Capabilities, Impact |
| OpenSpec spec | Requirements, Acceptance Criteria |

### Step 5: No spec found

If no spec is found in any directory or in the changed
files, note this and use the PR title/description or
branch name as the intent source. No error or warning
needed — not every change has a spec.

---

## Protocol 2: Issue Linking

Parse and fetch linked issues to extract acceptance
criteria for alignment checking. Two ownership paths:

- **Dispatch consumers** (`uf.review-council`,
  `uf.unleash`): the dispatch owns acquisition --
  callers MUST NOT call `acquire_intent_context`
  separately. Pass `pr_body` and `repo` on
  `dispatch_review_runs` (see its tool description for
  resolution and fetch detail); acquisition failure
  never blocks.
- **Non-dispatch consumers** (`uf.review-pr`
  Protocol 2b, `uf.address-feedback` Tier 1): call
  `acquire_intent_context` directly with `pr_body`
  (the fetched PR body) and `repo` (the PR's base
  repository) and use its intent-satisfaction output.
  For the full resolution, fetch, and extraction
  contract see the `acquire_intent_context` tool
  description.

---

## Protocol 3: Path-Based Focus Heuristics

Classify each changed file against built-in heuristics
to guide review emphasis. The classification is additive
— it supplements standard review categories, not
replaces them.

### Classification table

| Path pattern | Focus category | Additional emphasis |
|-------------|---------------|-------------------|
| `*_test.go`, `*_test.py`, `**/__tests__/**`, `**/*_spec.*` | `test-quality` | Edge cases, assertion strength, mock isolation, test naming |
| `**/cmd/**`, `**/cli/**` | `cli-ux` | Error messages, flag validation, help text |
| `**/api/**`, `**/handler/**`, `**/middleware/**`, `**/routes/**` | `security` | Auth, input validation, injection |
| `*.md`, `docs/**` | `documentation` | Clarity, accuracy, broken links |
| `.github/workflows/**`, `Dockerfile*` | `ci-cd` | Permissions, pinned versions, secrets exposure |
| `go.mod`, `package.json`, `requirements.txt` | `dependencies` | Maintenance status, license, scope |
| Everything else | `standard` | Architecture, SOLID, coupling, baseline security |

### Application

For each changed file:

1. Match the file path against the table (first match
   wins for multi-match paths).
2. Record the focus category.
3. When reviewing the file, append the matched focus
   instruction to the review context for that file.

Security review (auth, input validation, injection)
applies to ALL changed files regardless of path
heuristic — the `security` focus category adds
additional emphasis, not exclusive coverage.

---

## Protocol 4: Walkthrough Generation

Generate a per-file change summary table while
analyzing each file's diff. The walkthrough is produced
alongside the review, not as a separate pass.

### Standard format (< 30 files)

```markdown
### Walkthrough
| File | Change | Focus |
|------|--------|-------|
| `internal/gateway/provider.go` | Add token expiry tracking | security |
| `internal/gateway/gateway_test.go` | Add regression test for stale tokens | test-quality |
| `cmd/unbound-force/gateway.go` | Register --provider flag | cli-ux |
```

### Directory-level format (>= 30 files)

For PRs with 30 or more changed files, generate
directory-level summaries instead of per-file
summaries:

```markdown
### Walkthrough
| Directory | Files | Summary | Focus |
|-----------|-------|---------|-------|
| `internal/gateway/` | 4 | Token refresh and provider abstraction | security |
| `cmd/unbound-force/` | 2 | CLI flag registration | cli-ux |
```

### Change descriptions

Each change summary describes **what** changed (e.g.,
"Add error handling for null inputs"), not **how** (no
code snippets). Keep summaries to one line.

---

## Result Format

Present the discovered context in a standardized
format that consuming commands can reference:

```
## Review Context

### Specification
- Type: Speckit | OpenSpec | None
- Path: specs/012-swarm/spec.md
- Sections loaded: Functional Requirements, User Stories

### Linked Issues (non-dispatch paths only)
| Issue | Title | Criteria |
|-------|-------|----------|
| #42 | Add auth endpoint | 3 checkboxes extracted |
| #43 | Fix token refresh | Acceptance Criteria section |

Omit this section on dispatch paths — the dispatch
owns acquisition and the intent check surfaces in the
council's final report instead.

### File Classification
| File | Focus |
|------|-------|
| ... | ... |

### Walkthrough
| File | Change | Focus |
|------|--------|-------|
| ... | ... | ... |
```

The consuming command uses this context to inform its
review analysis and output formatting.
