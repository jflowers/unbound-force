## Why

Muti-Mind (PO) and Mx F (Manager) were implemented as part of a 6-stage
swarm orchestration model. In practice, the orchestration engine
(internal/orchestration/) and its workflow commands impose process
overhead without delivering commensurate value. The heroes being removed
represent capabilities — backlog management, priority decisions, metrics
collection, coaching, and sprint coordination — that are better served
through simpler tooling or are simply no longer needed in the current
workflow. Removing them along with the orchestration engine simplifies
the codebase by eliminating ~50 files and ~15 packages.

## What Changes

- **Delete Muti-Mind (#565)**: cmd/mutimind/, internal/backlog/,
  internal/metrics/collect_mutimind.go, .opencode/agents/muti-mind-po.md,
  12 .opencode/commands/muti-mind.*.md, schemas/hero-manifest/muti-mind-hero.json,
  schemas/backlog-item/, schemas/acceptance-decision/

- **Delete Mx F (#566)**: cmd/mxf/, internal/coaching/, internal/impediment/,
  internal/sprint/, internal/dashboard/, internal/metrics/,
  internal/sync/, .opencode/agents/mx-f-coach.md,
  scaffold/assets/opencode/agents/mx-f-coach.md,
  schemas/metrics-snapshot/, schemas/coaching-record/

- **Delete orchestration engine**: internal/orchestration/,
  5 workflow commands (.opencode/commands/workflow-*.md),
  schemas/workflow-record/

- **Modify internal/schemas/**: Drop orchestration and metrics imports
  from types.go, remove type aliases for deleted schemas, unregister
  deleted schemas from registry.go, update generate_test.go

- **Modify internal/artifacts/**: Remove muti-mind-specific artifact
  generation functions (GenerateBacklogItemArtifact,
  GenerateAcceptanceDecision), drop backlog import

- **Modify internal/doctor/**: Drop orchestration import, remove hero
  detection calls

- **Modify internal/scaffold/**: Remove .uf/workflows/ from generated
  gitignore, remove muti-mind/mx-f/workflow command entries from
  expected-file maps

- **Update agent/doc files**: Remove Muti-Mind and Mx F references from
  divisor agents (divisor-scribe, divisor-envoy, divisor-herald) and
  their scaffolded copies, unbound-force-heroes skill, and documentation
  files (AGENTS.md, README.md, CHANGELOG.md, docs/architecture.md,
  docs/cli-reference.md, docs/usage.md, docs/heroes.md)

- **Update configuration**: coverage-gate.json, .gitignore,
  .gaze/baseline.json, constitution.md

- **Preserve historical specs**: All specs/ (004-muti-mind-architecture,
  007-mx-f-architecture, 008-swarm-orchestration, etc.) and
  OpenSpec changes remain as-is

## Capabilities

### Removed Capabilities
- **muti-mind backend CLI**: Backlog management, acceptance decisions,
  GitHub issue sync
- **mxf backend CLI**: Metrics collection, coaching records, impediment
  tracking, sprint management, dashboards
- **muti-mind agent**: Product Owner persona with backlog commands
- **mx-f-coach agent**: Coaching and retrospective facilitation persona
- **orchestration engine**: 6-stage workflow lifecycle, hero detection,
  workflow state persistence, learning feedback
- **workflow commands**: /workflow start/seed/status/list/advance
- **backlog-item schema**: Backlog item artifact definition
- **acceptance-decision schema**: Acceptance decision artifact definition
- **metrics-snapshot schema**: Mx F metrics snapshot artifact definition
- **coaching-record schema**: Mx F coaching record artifact definition
- **workflow-record schema**: Workflow record artifact definition

## Impact

- ~50 files deleted across Go packages, commands, agents, schemas
- ~20 files modified to remove references
- internal/orchestration/ package fully removed — no replacement
- 4 internal packages fully removed: backlog, coaching, impediment,
  sprint, dashboard, metrics, sync
- 2 CLI binaries removed: mutimind, mxf
- .gitignore cleaned of muti-mind/mx-f/workflow entries
- coverage-gate.json scope reduced
- Schema registry shrinks from 8 to 3 registered schemas (envelope,
  quality-report, review-verdict)

## Content Pipeline

The architectural simplification from 5 orchestrated heroes to 3 independent
heroes represents a strategic evolution of the project — shifting from a
workflow-heavy engine to lightweight, autonomous collaboration. A blog post
or announcement article may be warranted to communicate this design
evolution externally. The Divisor Herald agent can assess and produce a
post after implementation is complete.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

Removing heroes reduces the number of artifact producers, but the
remaining heroes (Cobalt-Crush, Gaze, Divisor) continue to collaborate
through well-defined artifacts. No new coupling is introduced. The
artifact envelope format remains the sole inter-hero communication
mechanism. Removed schemas no longer produce artifacts that other heroes
consumed, so there is no gap — any cross-hero data flow that referenced
removed schemas was already undirected.

### II. Composability First

**Assessment**: PASS

Every remaining hero (Cobalt-Crush, Gaze, Divisor) remains independently
installable and usable. Removing Muti-Mind and Mx F eliminates heroes
that were least used standalone. No remaining hero had a hard dependency
on these removed heroes. The additive value from combining remaining
heroes is unchanged — Gaze quality reports still inform Divisor reviews,
and Cobalt-Crush remains the autonomous implementation engine.

### III. Observable Quality

**Assessment**: PASS

Remaining heroes continue to produce machine-parseable output with
provenance metadata. Gaze still produces quality reports. The Divisor
still produces review verdicts with provenance. The schema registry
shrink does not affect the observability of remaining components. No
quality gates are weakened; the remaining schemas (envelope,
quality-report, review-verdict) maintain the same provenance
requirements.

### IV. Testability

**Assessment**: PASS

Removing packages eliminates their test suites, but does not weaken
testability for remaining code. The coverage gate scope is reduced to
match. No test isolation is compromised. The removal of
internal/orchestration/ eliminates a package that imported several others
— this simplifies cross-package test dependencies. Coverage thresholds
for remaining packages are unchanged.

### V. Security by Default

**Assessment**: N/A

This change removes code rather than adding it, so it does not introduce
new dependencies, inputs, or privilege requirements. No new attack
surface is created. Supply chain integrity of remaining dependencies is
unchanged.