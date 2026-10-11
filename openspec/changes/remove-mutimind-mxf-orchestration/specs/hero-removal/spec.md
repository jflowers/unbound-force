## REMOVED Requirements

### Requirement: Muti-Mind Product Owner Hero

The muti-mind hero (Muti-Mind) served as the Product Owner persona,
managing a Markdown/YAML-frontmatter backlog, generating user stories,
making acceptance decisions, and syncing with GitHub Issues and Projects.
Its removal eliminates the PO role from the swarm, along with all
associated tooling.

**Reason**: The orchestration-heavy workflow imposed more process overhead
than the backlog management capability delivered in practice. Backlog
tracking is handled directly through GitHub issues and Speckit/OpenSpec
workflows.

#### Scenario: Backlog management removed
- **GIVEN** the mutimind CLI is no longer installed
- **WHEN** a user attempts backlog operations
- **THEN** they MUST use GitHub issues or Speckit/OpenSpec for
  work tracking

#### Scenario: Agent commands removed
- **GIVEN** the muti-mind-po agent file is deleted
- **WHEN** OpenCode loads available agents
- **THEN** muti-mind MUST NOT appear in the agent list

#### Scenario: 12 slash commands removed
- **GIVEN** all .opencode/commands/muti-mind.*.md files are deleted
- **WHEN** a user invokes /muti-mind.* or lists available commands
- **THEN** no muti-mind commands MUST be available

### Requirement: Mx F Manager Hero

The mx-f hero (Mx F) served as the Flow Facilitator and Continuous
Improvement Coach, collecting metrics, detecting impediments, managing
sprints, rendering dashboards, and facilitating retrospectives. Its
removal eliminates automated metrics collection and coaching from the
swarm.

**Reason**: Mx F's capabilities were aspirational with limited adoption.
Gaze quality reports continue to provide machine-parseable quality data.
The coaching and retrospective features were not used in practice.

#### Scenario: Metrics collection removed
- **GIVEN** internal/metrics/ and cmd/mxf/ are deleted
- **WHEN** a user runs any CLI command
- **THEN** mxf MUST NOT be available as a command

#### Scenario: Agent removed
- **GIVEN** the mx-f-coach agent file and scaffold copy are deleted
- **WHEN** OpenCode loads available agents or scaffold generates files
- **THEN** mx-f-coach MUST NOT appear

### Requirement: Orchestration Engine

The orchestration engine (internal/orchestration/) managed a 6-stage
hero lifecycle (define, implement, validate, review, accept, reflect),
hero availability detection, workflow state persistence, and learning
feedback extraction. Its removal eliminates all lifecycle workflow
state management.

**Reason**: The orchestration engine was the structural backbone tying
the 6-stage workflow together. With define/accept (muti-mind) and
reflect (mx-f) already being removed, the remaining stages
(implement→cobalt-crush, validate→gaze, review→divisor) have no runtime
orchestration dependency — each hero operates independently.

#### Scenario: Workflow commands removed
- **GIVEN** all .opencode/commands/workflow-*.md files are deleted
- **WHEN** a user invokes /workflow start, /workflow seed,
  /workflow status, /workflow list, or /workflow advance
- **THEN** no workflow commands MUST be available

#### Scenario: Hero detection removed
- **GIVEN** internal/orchestration/ is deleted
- **WHEN** internal/doctor/ performs health checks
- **THEN** hero availability reporting MUST NOT be included

#### Scenario: Workflow state removed
- **GIVEN** internal/orchestration/ is deleted
- **WHEN** the user works through Speckit or OpenSpec workflows
- **THEN** no .uf/workflows/ state files MUST be generated or expected

### Requirement: Backlog Item Schema

The backlog-item schema (schemas/backlog-item/v1.0.0.schema.json)
defined the artifact format for Muti-Mind backlog items with BI-NNN
ID generation, priority sorting, and Markdown/YAML frontmatter.

**Reason**: No remaining hero produces or consumes backlog-item artifacts.

### Requirement: Acceptance Decision Schema

The acceptance-decision schema (schemas/acceptance-decision/)
defined the artifact format for Muti-Mind acceptance decisions.

**Reason**: No remaining hero produces or consumes acceptance-decision
artifacts.

### Requirement: Metrics Snapshot Schema

The metrics-snapshot schema (schemas/metrics-snapshot/) defined the
artifact format for Mx F metrics snapshots.

**Reason**: No remaining hero produces or consumes metrics-snapshot
artifacts.

### Requirement: Coaching Record Schema

The coaching-record schema (schemas/coaching-record/) defined the
artifact format for Mx F coaching and retrospective records.

**Reason**: No remaining hero produces or consumes coaching-record
artifacts.

### Requirement: Workflow Record Schema

The workflow-record schema (schemas/workflow-record/) defined the
artifact format for orchestration workflow records.

**Reason**: The orchestration engine is removed; no remaining component
produces or consumes workflow-record artifacts.

### Requirement: GitHub Issue Sync

The internal/sync/ package provided bidirectional sync between
Muti-Mind backlog items and GitHub Issues/Projects via GHRunner.

**Reason**: GHRunner has zero remaining consumers after muti-mind
and mxf removal. The package MUST be fully deleted.

### Requirement: Muti-Mind Backlog Package

The internal/backlog/ package provided CRUD operations for
Markdown/YAML-frontmatter backlog items with BI-NNN ID generation.

**Reason**: Only consumed by cmd/mutimind/ and internal/sync/. No
remaining consumers.

### Requirement: Mx F Supporting Packages

The internal/coaching/, internal/impediment/, internal/sprint/,
internal/dashboard/, and internal/metrics/ packages supported
Mx F's metrics, coaching, and sprint capabilities.

**Reason**: All consumed only by cmd/mxf/ (and each other). No
remaining consumers after mxf removal.