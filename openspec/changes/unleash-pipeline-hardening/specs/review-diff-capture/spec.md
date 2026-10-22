## ADDED Requirements

### Requirement: Review diff capture tool

The review-dispatch plugin MUST provide a single intent-level
tool that assembles the review diff for a working tree: resolve
the base ref, include all files the change touched (tracked
modifications, untracked files, and files covered by local
gitignore/exclude rules), exclude unrelated untracked noise,
emit a numstat summary, and persist the diff to a bounded,
traversal-safe path. The tool MUST return the diff path, the
file list, and the addition/deletion counts as structured
output.

The command templates MUST replace their prose diff-capture
recipes with a call to this tool.

#### Scenario: Feature directory is locally git-ignored

- **GIVEN** the change's feature files live under a directory
  ignored via `.git/info/exclude`, so
  `git ls-files --others --exclude-standard` returns nothing
  for them
- **WHEN** the diff capture tool runs
- **THEN** the saved diff contains every feature file, and the
  returned file list matches the files actually created by the
  change

#### Scenario: Untracked noise is present

- **GIVEN** the working tree contains untracked build artifacts
  outside the change scope
- **WHEN** the diff capture tool runs
- **THEN** the saved diff excludes the noise and includes only
  files attributable to the change

### Requirement: Base divergence fallback

The diff capture tool (and the base-ref resolution it uses)
MUST detect the case where the resolved base commit is a
descendant of HEAD (base ahead of head, e.g. a stale fork
behind its upstream) and MUST NOT silently produce a diff
against such a base. When divergence is detected, the tool
MUST fall back to uncommitted-local diff mode (working tree
against HEAD) and record the divergence and the fallback
reason in its structured output.

#### Scenario: Stale fork behind upstream

- **GIVEN** `resolve_base_ref` resolves `upstream/main`, which
  is 445 commits ahead of the local fork HEAD
- **WHEN** the diff capture tool runs
- **THEN** it emits a diff of the working tree against local
  HEAD, and its output reports the divergence and the
  fallback mode

#### Scenario: Healthy base

- **GIVEN** the resolved base is an ancestor of HEAD
- **WHEN** the diff capture tool runs
- **THEN** it emits the normal base-to-working-tree diff with
  no fallback marker
