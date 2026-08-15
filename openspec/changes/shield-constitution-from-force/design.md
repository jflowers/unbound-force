## Context

The scaffold engine (`internal/scaffold/scaffold.go`) walks
embedded assets and writes them to the target directory. The
`Run()` function has three file-writing paths:

1. **File does not exist**: Create it (lines 167-173)
2. **File exists + `--force`**: Overwrite unconditionally
   (lines 177-184)
3. **File exists + no force**: Skip user-owned files, update
   tool-owned files only on content diff (lines 186-201)

The constitution (`specify/memory/constitution.md`) is correctly
classified as user-owned by `isToolOwned()`, so path 3 protects
it on normal re-runs. But path 2 bypasses all ownership checks,
destroying user customizations when `--force` is used.

## Goals / Non-Goals

### Goals
- Protect the constitution from `--force` overwrite
- Introduce an extensible "never overwrite" predicate for
  files that must survive all scaffold operations
- Maintain the existing `Result` reporting contract (protected
  files appear in `Skipped`)
- Keep the change minimal and surgical

### Non-Goals
- General user-file protection beyond the constitution (the
  existing `isToolOwned` + skip-on-rerun behavior handles this)
- Adding CLI flags to control which files `--force` affects
- Changing the UX to warn or prompt about protected files
- Protecting the constitution from first-time creation (it
  should still be created if it does not exist)

## Decisions

### D1: Separate predicate, not extension of `isToolOwned`

The `isNeverOverwrite` function is a separate predicate rather
than a modification to `isToolOwned`. Rationale:

- `isToolOwned` answers "should this file be auto-updated on
  content diff?" — a different question from "should this file
  survive `--force`?"
- The constitution is user-owned AND never-overwritable. These
  are orthogonal properties. Conflating them into `isToolOwned`
  would invert its semantics for this file.
- A separate predicate is independently testable and clearly
  communicates intent.

### D2: Guard placement before the force block

The `isNeverOverwrite` check is inserted before the `opts.Force`
block (before line 177), not inside it. This means:

- Protected files are skipped before any force logic executes
- The control flow is: exists? → never-overwrite? → force? →
  tool-owned?
- This is the simplest insertion point with no risk of
  disrupting the existing force or tool-owned paths

### D3: Silent skip to `Skipped` list

Protected files are added to `result.Skipped` with no special
notice, warning, or separate result category. Rationale:

- Consistent with how user-owned files are already reported
  on normal re-runs
- Adding a new result category (e.g., `Protected`) would
  change the `Result` struct, affecting all consumers
- The constitution is the only file in this set; special UX
  treatment is not justified

### D4: Hardcoded path, not configuration

The never-overwrite set is a hardcoded list (currently one
entry: `specify/memory/constitution.md`), not a configurable
option. Rationale:

- The constitution's protected status is a design invariant,
  not a user preference
- Configuration adds complexity with no current use case
- If more files need protection, the predicate is trivially
  extensible

## Risks / Trade-offs

### R1: User expects `--force` to reset everything

A user running `--force` to reset a broken project setup might
expect the constitution to also be reset. Mitigation: the
starter constitution is still created on first run. If a user
truly needs to reset it, they can delete the file and re-run
`uf init` (without `--force`).

### R2: Future protected files

If more files are added to the never-overwrite set, there is
no mechanism to communicate to the user which files were
protected. Acceptable risk: the current set has one member,
and the `Skipped` list is visible in the output.
