<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, and (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Canonical command and pack edits

- [x] 1.1 Rewrite the Spec Review Mode MANDATORY GATE in
      `.opencode/commands/uf.review-council.md` (and the
      hybrid fix policy + verdict sections that follow it)
      into the per-finding decision protocol: severity-
      ordered findings, text-above/question-below
      presentation with per-option reasoning and a
      recommendation, exact option labels ("Apply
      suggested fix", "Override & continue", "Show more
      context", "Pause & exit", plus "Apply all remaining
      LOW/MEDIUM fixes" for LOW/MEDIUM findings), override
      recording, session-resume guard, re-review and
      3-iteration-cap rules
- [x] 1.2 Update `/uf.unleash` Step 4 processing results in
      `.opencode/commands/uf.unleash.md` to route every
      REQUEST CHANGES verdict through the per-finding
      protocol cited from uf.review-council.md; reword the
      guardrails ("single exception" gate name, the
      HIGH/CRITICAL exit rule, the valid exit-reasons
      list); keep checkpoint step "spec-review" and add
      overrides to its data
- [x] 1.3 [P] Add the clarifying note after the Auto-Fix
      Policy (Spec Review Mode) table in
      `.opencode/uf/packs/severity.md`: human-directed
      per-finding fixes (any severity, explicit consent)
      vs. autonomous auto-fixes (LOW/MEDIUM only);
      definitions and policy rows unchanged
- [x] 1.4 Update the spec-review exit reason string in
      `.opencode/lib/unleash-templates.ts` to "Unresolved
      spec review findings (pause or iteration cap)" plus
      its doc comments; update the `format_unleash_exit`
      findings-param description in
      `.opencode/plugins/uf-workflow/index.ts`; update the
      two reason assertions in
      `.opencode/test/unleash-formatters.test.ts`

## 2. Scaffold mirrors and structural tests

- [x] 2.1 Sync the five scaffold mirrors from the
      canonical files:
      `internal/scaffold/assets/opencode/commands/uf.review-council.md`,
      `internal/scaffold/assets/opencode/commands/uf.unleash.md`,
      `internal/scaffold/assets/opencode/uf/packs/severity.md`,
      `internal/scaffold/assets/opencode/lib/unleash-templates.ts`,
      `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [x] 2.2 Extend `internal/scaffold/scaffold_test.go`
      structural assertions for the per-finding protocol:
      option labels present in both command assets,
      mandatory gate markers retained, severity-order
      presentation, no-autonomous-progression rule,
      severity pack note present, no stale bulk-gate
      option labels; update the
      TestUnleashCommand_ToolRoutingContracts spec-review
      exit anchor; rewrite the "advisory and human fix
      gate" clause in
      `internal/scaffold/command_contract_test.go` to pin
      the new protocol fragments

## 3. Documentation

- [x] 3.1 [P] Add the CHANGELOG.md entry for the
      spec review per-finding decision gate
- [x] 3.2 Grep the repo for stale references to the old
      gate ("Skip auto-fixes -- report only", "Review
      findings first", "spec auto-fix consent gate") in
      commands, skills, and docs; update any citation
      sites to the new protocol
- [x] 3.3 [P] File the documentation issue for this
      user-facing spec review behavior change before PR
      merge (documentation gate)
      - Record: maintainer exemption recorded 2026-10-22
        during /uf.unleash spec review (override
        justification: "This change is not substantial
        enough"); no repo docs issue or website issue
        filed per maintainer decision.

## 4. Verification

- [x] 4.1 Gate structure checks: grep the two command
      files for `>>> MANDATORY GATE` marker pairs, all
      five option labels, and the session-resume guard;
      confirm no HIGH/CRITICAL dead-stop branch remains
      in Step 4 processing; confirm the updated exit
      reason string in the template, the plugin
      description, and the formatter test assertions
- [x] 4.2 Scaffold drift tests:
      `go test -race -count=1 ./internal/scaffold/...`
- [x] 4.3 Full check suite: `make check` (lint, test,
      build, coverage-gate, plugin-test)
- [x] 4.4 Verify constitution alignment per the proposal:
      III (observable question-tool events, durable
      override records), IV (drift tests + structural
      assertions), V (per-finding consent), VI (judgment
      in prose, tool-rendered exits) — confirm each PASS
      assessment still holds on the implemented result
<!-- scaffolded by uf vdev -->
