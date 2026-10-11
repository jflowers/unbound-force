<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Delete Go packages and binaries

- [x] 1.1 [P] Delete cmd/mutimind/ directory
- [x] 1.2 [P] Delete cmd/mxf/ directory
- [x] 1.3 [P] Delete internal/backlog/ directory
- [x] 1.4 [P] Delete internal/coaching/ directory
- [x] 1.5 [P] Delete internal/impediment/ directory
- [x] 1.6 [P] Delete internal/sprint/ directory
- [x] 1.7 [P] Delete internal/dashboard/ directory
- [x] 1.8 [P] Delete internal/metrics/ directory
- [x] 1.9 [P] Delete internal/sync/ directory
- [x] 1.10 [P] Delete internal/orchestration/ directory
- [x] 1.11 Delete mutimind binary from repository root
- [x] 1.12 [P] Delete schemas/hero-manifest/muti-mind-hero.json
- [x] 1.13 [P] Delete schemas/backlog-item/ directory
- [x] 1.14 [P] Delete schemas/acceptance-decision/ directory
- [x] 1.15 [P] Delete schemas/metrics-snapshot/ directory
- [x] 1.16 [P] Delete schemas/coaching-record/ directory
- [x] 1.17 [P] Delete schemas/workflow-record/ directory

## 2. Delete agent and command files

- [x] 2.1 [P] Delete .opencode/agents/muti-mind-po.md
- [x] 2.2 [P] Delete .opencode/agents/mx-f-coach.md
- [x] 2.3 [P] Delete internal/scaffold/assets/opencode/agents/mx-f-coach.md
- [x] 2.4 [P] Delete 12 .opencode/commands/muti-mind.*.md files
- [x] 2.5 [P] Delete 5 .opencode/commands/workflow-*.md files

## 3. Modify internal/schemas/

- [x] 3.1 Update internal/schemas/types.go -- drop orchestration and metrics imports, remove type aliases for BacklogItemPayload, AcceptanceDecisionPayload, CoachingRecordPayload, MetricsSnapshotPayload, WorkflowRecordPayload, WorkflowStagePayload, DecisionPayload; keep artifacts import for AcceptanceDecision, ArtifactContext, ReviewVerdictDecision
- [x] 3.2 [P] Update internal/schemas/registry.go -- unregister backlog-item, acceptance-decision, metrics-snapshot, coaching-record, workflow-record; keep envelope, quality-report, review-verdict
- [x] 3.3 [P] Update internal/schemas/generate_test.go -- remove tests for deleted schema generation

## 4. Modify remaining Go packages

- [x] 4.1 [P] Update internal/artifacts/artifacts.go -- remove GenerateBacklogItemArtifact and GenerateAcceptanceDecision functions, drop backlog import
- [x] 4.2 [P] Update internal/artifacts/artifacts_test.go -- remove tests for deleted functions
- [x] 4.3 [P] Update internal/doctor/checks.go -- drop orchestration import, remove DetectHeroes() call and hero detection logic
- [x] 4.4 [P] Update internal/doctor/doctor_test.go -- remove hero availability test setup
- [x] 4.5 [P] Update internal/scaffold/scaffold.go -- remove .uf/workflows/ from generated .gitignore block, remove mutimind/mxf agent and command entries
- [x] 4.6 [P] Update internal/scaffold/scaffold_test.go -- update expected-file maps to not reference deleted files

## 5. Update agent definition files

- [x] 5.1 [P] Update .opencode/agents/divisor-scribe.md -- remove muti-mind references
- [x] 5.2 [P] Update .opencode/agents/divisor-envoy.md -- remove muti-mind references
- [x] 5.3 [P] Update .opencode/agents/divisor-herald.md -- remove muti-mind references
- [x] 5.4 [P] Update internal/scaffold/assets/opencode/agents/divisor-scribe.md -- mirror live agent changes
- [x] 5.5 [P] Update internal/scaffold/assets/opencode/agents/divisor-envoy.md -- mirror live agent changes
- [x] 5.6 [P] Update internal/scaffold/assets/opencode/agents/divisor-herald.md -- mirror live agent changes
- [x] 5.7 [P] Update .opencode/skill/unbound-force-heroes/SKILL.md -- remove muti-mind, mx-f, and workflow command references
- [x] 5.8 [P] Update .opencode/agents/cobalt-crush-dev.md -- remove orchestration workflow mention

## 6. Update documentation and configuration

- [x] 6.1 [P] Update AGENTS.md -- remove muti-mind, mx-f, orchestration from project structure and hero list
- [x] 6.2 [P] Update README.md -- remove hero descriptions, workflow commands, package listings
- [x] 6.3 [P] Update CHANGELOG.md -- add entries for #565 and #566 removals
- [x] 6.4 [P] Update docs/architecture.md -- remove muti-mind and mx-f sections
- [x] 6.5 [P] Update docs/cli-reference.md -- remove mutimind and mxf command documentation
- [x] 6.6 [P] Update docs/usage.md -- remove workflow commands and hero references
- [x] 6.7 [P] Update docs/heroes.md -- remove muti-mind and mx-f hero descriptions
- [x] 6.8 [P] Update .gitignore -- remove mutimind binary, .uf/muti-mind/, .uf/mx-f/, .uf/workflows/, .muti-mind/, .mx-f/ entries
- [x] 6.9 [P] Update coverage-gate.json -- remove cmd/mutimind, cmd/mxf, internal/orchestration, internal/metrics scope entries; do not modify remaining threshold values
- [x] 6.10 [P] Update .specify/memory/constitution.md -- update Muti-Mind and Mx F example references in Observable Quality rationale. This is a PATCH-level constitution amendment; follow Governance section process (proposed via PR, reviewed, approved, version bump 1.3.0 → 1.3.1).
- [x] 6.11 File website documentation issue in unbound-force/website for orchestration engine / workflow lifecycle reference cleanup (hero-specific issues #272 and #273 already cover Muti-Mind and Mx F pages)

## 7. Verify and finalize

- [x] 7.1 Run `go build ./...` to confirm compilation succeeds with all imports resolved
- [x] 7.2 Run `go vet ./...` for static analysis
- [x] 7.3 Run `go test -race -count=1 ./...` for full test suite
- [x] 7.4 Regenerate `.gaze/baseline.json` (run gaze on remaining packages)
- [x] 7.5 Run `make lint` for full linting (vet + golangci-lint)
- [x] 7.6 Run `make check` for full CI parity (lint, test, build, coverage gate, plugin tests)
- [x] 7.7 Verify constitution alignment: all remaining heroes continue to operate independently with artifact-based communication, machine-parseable output, and testability

<!-- spec-review: passed -->
<!-- code-review: passed -->