<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file — parallel
  workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Command prose: Step 1 ask gate

- [ ] 1.1 Rewrite `.opencode/commands/uf.unleash.md` Step 1 (Clarify, Speckit branch): after the per-question Dewey loop, replace the direct-to-exit unanswerable flow with the interactive clarify ask gate — for each unanswerable question, ask the human through a single question tool call (one question at a time, never batched, next question only after the previous response is received) carrying the question text and its surrounding spec context from the scan; SHOULD formulate 2-5 mutually exclusive options from the question's own enumerated alternatives when present, MUST list the spec's stated working default first labeled "(Recommended)" when one is stated, and MUST keep the custom free-form option enabled; include a defer option that leaves the question on the unanswerable list; apply a chosen or custom answer via `resolve_clarification` with `resolved_by: "human"` (source omitted); after processing, announce the auto-resolved, human-answered, and deferred counts; exit through `format_unleash_exit` variant "clarify" only when deferred questions remain; when the question tool is unavailable, keep today's behavior (all unanswerable questions flow to the exit)
- [ ] 1.2 Route the Dewey-unavailable branch into the same ask gate: replace the "add ALL questions to the unanswerable list" note so Dewey-unavailable questions become ask-gate candidates (the gate uses the question tool, which is independent of Dewey); keep the direct-to-exit path only for question-tool-unavailable sessions
- [ ] 1.3 Update the uf.unleash.md frontmatter description to mention interactive clarify (currently "clarify ambiguities with Dewey")
- [ ] 1.4 Extend the Guardrails first bullet: the Step 1 interactive clarify ask gate joins the Step 4 per-finding spec review decision gate as the legitimate mid-pipeline human interactions (required human input within a step, not a between-step confirmation), keeping deferred clarify questions among the enumerated valid exits

## 2. Plugin: resolve_clarification provenance

- [ ] 2.1 Add the optional `resolved_by` enum input ("dewey" | "human", default "dewey") to `ResolveClarificationInputSchema` in `.opencode/plugins/uf-workflow/index.ts`, with schema-level conditional validation: `source` is required when `resolved_by` is "dewey" or omitted, and MUST be omitted when `resolved_by` is "human" (fail-closed, not caller discipline)
- [ ] 2.2 Render the Clarifications log entry suffix by `resolved_by`: `(Dewey-resolved from ${source})` for dewey (byte-identical to today's template) and `(human-answered during /uf.unleash clarify)` for human; the default path (field omitted) MUST produce today's output exactly
- [ ] 2.3 Update the `resolve_clarification` tool description string and the schema/doc comments (currently "Dewey provenance... page name or block UUID") to describe both modes, the conditional `source` requirement, and the `resolved_by` default

## 3. Mirror sync

- [ ] 3.1 Mirror every changed path under `.opencode/` to `internal/scaffold/assets/opencode/` — `commands/uf.unleash.md` and `plugins/uf-workflow/index.ts` (all content edits from tasks 1.1-1.4 and 2.1-2.3 land on the canonical `.opencode/` sources first; this task is purely mechanical copying) — and verify byte-identity with `cmp` for each pair; `.opencode/test/` is not a scaffold asset and is not mirrored

## 4. Tests

- [ ] 4.1 Extend `.opencode/test/unleash-clarify.test.ts` with `resolved_by` cases: the default path (field omitted, source present) renders `(Dewey-resolved from ...)` exactly as the existing assertions pin; `resolved_by: "human"` with `source` omitted renders `(human-answered during /uf.unleash clarify)`, removes the marker, splices the answer inline, and appends the Clarifications entry; `resolved_by: "dewey"` (or omitted) without `source` is rejected by schema validation; `resolved_by: "human"` with a `source` supplied is rejected (provenance honesty, fail-closed); an invalid `resolved_by` value is rejected; existing Dewey-path assertions MUST remain valid unmodified under the default
- [ ] 4.2 Verify the neighboring suites still hold: `.opencode/test/unleash-resume.test.ts` provenance-format assertions (lines ~85, ~145) unchanged under the default rendering, and `.opencode/test/golden-output-shape.test.ts` clarify-exit coverage (the defer fallback path) unchanged — no edits expected; record the result

## 5. Verification

> CI parity: `make plugin-test`, `make test`, and `make lint`
> replicate the Local CI workflow's job surface for this change
> (the TypeScript plugin suite including the new resolved_by
> cases; the Go suite plus the scaffold drift tests that enforce
> the byte-identical mirrors; vet + golangci-lint). `make build`
> and `make coverage-gate` are omitted deliberately — no
> production `.go` source changes in this command-prose-plus-
> plugin-plus-test change; the mirrored assets are re-embedded
> and compiled by `make test`, covering the build surface. The
> CI Checks workflow's MegaLinter surface (Go, Actions, Bash,
> Gitleaks; markdownlint disabled) and its commitlint apply at
> commit time. Task 5.5's local Markdown style pass is
> deliberately beyond CI, not CI parity.

- [ ] 5.1 Run `make plugin-test` — the new resolved_by cases plus the existing clarify, resume, and golden-output suites must pass (94 percent statements coverage floor holds)
- [ ] 5.2 Run `make test` — scaffold drift tests (byte-identical mirrors) and the full Go suite must pass
- [ ] 5.3 Run `make lint` — vet + golangci-lint must pass
- [ ] 5.4 Run `openspec validate unleash-interactive-clarify --type change --strict`
- [ ] 5.5 Run a local Markdown style pass (markdownlint, using the repository's MegaLinter markdownlint configuration) over `openspec/changes/unleash-interactive-clarify/` — the change's new Markdown artifacts — as a deliberately beyond-CI style check, keeping the artifacts' style consistent with the predecessor changes' accepted profile

## 6. Documentation

- [ ] 6.1 [P] Add a CHANGELOG.md entry describing the interactive clarify ask gate (Dewey-unanswerable and Dewey-unavailable questions asked via the question tool before any exit; defer fallback; `resolved_by` provenance in the Clarifications log)
- [ ] 6.2 [P] Assess the documentation gate and record the result: the behavior change is user-visible (the speckit-tier clarify step now asks instead of exiting), so the gate MUST be assessed rather than presumed exempt — search open issues in this repo first (the unleash docs coverage scoped by #739 may absorb the workflow delta; reference rather than duplicate) and, per the Cross-Repo Documentation rule, search open `unbound-force/website` issues (the #309/#310 docs counterparts) before filing; file a documentation issue for the user-facing behavior change if no open coverage exists, and record the referenced/filed issue numbers or the per-target exemption rationale; AGENTS.md is exempt (pipeline step structure, build commands, and conventions unchanged — record that assessment); README.md is assessed explicitly — it documents /uf.unleash only at the tier-routing level (Specification Framework table), so record the expected no-change outcome

## 7. Constitution alignment verification

- [ ] 7.1 Verify constitution alignment: I (the gate asks exactly the questions Dewey cannot answer — silent auto-resolution preserved — and deferral preserves unattended runs), II (composes the existing question tool, resolve_clarification mechanics, and clarify exit; one optional schema field, no new plugin or registration), III (every Clarifications entry records who resolved it; counts announced), IV (resolved_by schema, conditional source, and both renderings pinned by vitest cases; the default path leaves existing assertions valid), V (closed zod enum, fail-closed conditional validation, all other schemas unchanged), VI (a structural question-tool gate with fixed option, ordering, labeling, defer, fallback, and counts rules; the default path is byte-identical to today's output); resolve any gap before finalizing

## 8. Archive sequencing

- [ ] 8.1 After the predecessors archive via `/opsx-archive` — `clarification-marker-superset` and `unleash-deterministic-tools`: run `openspec validate` for this change and re-verify the MODIFIED "Clarification mechanics tools" anchor against `clarification-marker-superset`'s archived text and the MODIFIED "Guardrail consistency" anchor against `unleash-deterministic-tools`' archived text; fix any drifted anchors before archiving this change (until the predecessors archive, this task gates this change's archive, not its implementation — the implementable-now portion is verifying each anchor matches its predecessor's current unarchived text verbatim except the designed clauses: for "Clarification mechanics tools", the provenance-carrying log-entry sentence, the added conditional-source validation sentence and scenario, the routing sentence and Dewey-unavailable scenario deleted (routing delegated to the ADDED requirement), and the added Human provenance rendering scenario; for "Guardrail consistency", the single-gate clause replaced by the two-gate enumeration, the rewritten Previously paragraph, and the extended scenario)
