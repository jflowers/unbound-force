## Context

The Unbound Force project currently deploys 4 heroes (Muti-Mind,
Cobalt-Crush, Gaze, Divisor) plus a manager (Mx F) across a 6-stage
orchestration lifecycle. Muti-Mind (#565) owns define/accept stages;
Mx F (#566) owns reflect. The orchestration engine (internal/orchestration/)
ties these heroes together with workflow state management and learning
feedback.

In practice, the orchestration overhead outweighs its value. Removing
Muti-Mind, Mx F, and the orchestration engine eliminates approximately
50 files and 15 packages. The remaining heroes (Cobalt-Crush, Gaze,
Divisor) continue to operate independently — they never had mandatory
dependencies on the removed components.

## Goals / Non-Goals

### Goals
- Delete all Muti-Mind implementation: cmd/mutimind/, internal/backlog/,
  agent, 12 commands, schemas, manifest
- Delete all Mx F implementation: cmd/mxf/, internal/coaching/,
  internal/impediment/, internal/sprint/, internal/dashboard/,
  internal/metrics/, internal/sync/, agent, schemas
- Delete orchestration engine: internal/orchestration/, 5 workflow
  commands, workflow-record schema
- Clean references from internal/schemas/, internal/artifacts/,
  internal/doctor/, internal/scaffold/
- Update agent files (3 divisor agents + 3 scaffolded copies),
  documentation, configuration
- Remove deleted packages from coverage-gate.json scope
- Regenerate .gaze/baseline.json

### Non-Goals
- Modify or delete any spec/ directory (004-muti-mind-architecture,
  007-mx-f-architecture, 008-swarm-orchestration, etc.) — preserved as
  historical
- Modify or delete any OpenSpec change record — preserved as historical
- Modify remaining heroes (Cobalt-Crush, Gaze, Divisor) beyond removing
  references to deleted heroes
- Modify the uf-workflow TypeScript plugin (separate review/release
  functionality, not related to the hero workflow engine)
- Modify CI workflows, Makefile, .goreleaser.yaml, or Dockerfiles
  (these contain no references to the removed components)

## Decisions

### D1: Delete internal/orchestration/ entirely

The orchestration engine maps all 6 stages to heroes. With define/accept
(muti-mind) and reflect (mx-f) removed, the remaining stages
(implement→cobalt-crush, validate→gaze, review→divisor) have no runtime
orchestration dependency — each hero runs independently. Deleting the
entire package is simpler than maintaining a skeleton with orphaned
stage constants.

### D2: Delete internal/sync/ entirely

GHRunner in internal/sync/ is consumed only by mutimind (backlog → GitHub
issue sync) and mxf (orchestration metrics). With both removed, the
package has zero remaining Go consumers. Full deletion.

### D3: Keep internal/artifacts/ but remove muti-mind functions

internal/artifacts/ is imported by internal/schemas/types.go for type
aliases (AcceptanceDecision, ArtifactContext, ReviewVerdictDecision).
Remove only the muti-mind-specific GenerateBacklogItemArtifact and
GenerateAcceptanceDecision functions, and drop the backlog import.
The GenerateQualityReport and GenerateReviewVerdict functions remain
untouched.

### D4: Remove 5 schemas from registry, keep 3

Unregister: backlog-item, acceptance-decision, metrics-snapshot,
coaching-record, workflow-record. Keep: envelope, quality-report,
review-verdict. Schema directories themselves are preserved as
historical documentation; only registry.go and types.go are modified.

### D5: Drop orchestration import from doctor/checks.go

internal/doctor/ currently calls orchestration.DetectHeroes() to
report hero availability. With orchestration deleted, remove the
import and the hero detection call. Doctor continues to perform its
remaining checks (tool availability, config, etc.).

### D6: Preserve all spec/ and OpenSpec files as historical

No spec directories or OpenSpec changes are modified or deleted.
They document past architectural decisions and remain valuable for
future reference. Only living code, agents, commands, schemas, and
configuration are changed.

### D7: Reduce coverage-gate.json scope

Remove internal/orchestration, cmd/mutimind, cmd/mxf, internal/metrics
from the coverage scope. Remaining packages keep their existing
thresholds unchanged (only scope entries are removed, no threshold
values are modified). Per the Gatekeeping Integrity behavioral rule,
coverage thresholds are quality gates and MUST NOT be weakened.

### D8: Acknowledge prior remove-mxf-setup-doctor change

The prior `remove-mxf-setup-doctor` OpenSpec change (May 2026) preserved
`cmd/mxf/` source code with the rationale: "the source may be built and
distributed in the future." This change supersedes that decision by fully
deleting `cmd/mxf/`. Between May and October 2026, Mx F's remaining
capabilities (metrics, coaching, sprint management) saw no adoption, and
the orchestration engine that tied heroes together is being removed in
the same change. Preserving `cmd/mxf/` without orchestration would leave
an orphaned binary that references deleted packages. Full deletion is
now the correct outcome.

## Risks / Trade-offs

**Risk**: Removing backlog management eliminates structured
cross-reference between backlog items (BI-NNN) and GitHub issues.
Mitigation: Backlog items can be tracked directly as GitHub issues;
the sync layer was convenience, not a necessary abstraction.

**Risk**: Removing Mx F eliminates automated metrics collection and
coaching. Mitigation: Gaze quality reports remain available and
provide machine-parseable quality data. Coaching was a proposed
capability with limited adoption.

**Risk**: Removing orchestration eliminates workflow state tracking
across hero stages. Mitigation: Each hero operates independently;
there is no longer a multi-stage lifecycle to track. Speckit and
OpenSpec provide their own workflow structure for spec-driven
development.

**Trade-off**: The constitution.md mentions Muti-Mind and Mx F as
examples in the Observable Quality rationale section. These
references will be updated to use remaining heroes as examples
(Gaze → Divisor quality-report → review-verdict flow).