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

## 1. Tool Implementation

- [ ] 1.1 Define `BuildReviewPromptsInputSchema` with
  Zod validation in `review-dispatch/index.ts`: agents
  (array of AgentNameSchema), mode (enum), command
  (enum), diff_path (string), changed_files (string),
  input_context (string), plus optional pre_flight_results,
  sibling_evidence, existing_reviews, walkthrough,
  review_context.
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [ ] 1.2 Define static prompt template constants:
  confinement rule text, prohibition text, and response
  contract text (referencing `submit_review_findings` and
  `submit_lesson_proposal` tools). Add as string constants
  in `review-dispatch/index.ts` near the tool definition.
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [ ] 1.3 Implement `buildReviewPrompts()` function:
  read agent definition files from
  `.opencode/agents/{agent}.md`, read AGENTS.md,
  constitution, convention packs from
  `.opencode/uf/packs/*.md`; assemble the 11 required
  sections per agent; write each prompt to
  `<dispatch-dir>/prompts/{agent}.md` or temp dir;
  return `{ prompts: [{ agent, path, size_bytes }] }`.
  Files: `.opencode/plugins/review-dispatch/index.ts`

- [ ] 1.4 Implement `createBuildReviewPromptsTool()`
  factory function wrapping `buildReviewPrompts()` with
  tool description and args. Wire into
  `ReviewDispatchPlugin.server()` registration (tool
  count 9 -> 10).
  Files: `.opencode/plugins/review-dispatch/index.ts`

## 2. Dual-Copy Sync

- [ ] 2.1 Sync scaffolded copy to canonical:
  `cp .opencode/plugins/review-dispatch/index.ts
  internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`.
  Verify byte-identical.
  Files: `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`

## 3. Tests

- [ ] 3.1 [P] Create `build-review-prompts.test.ts` with
  test cases:
  - Produces one prompt file per agent in the agents array
  - Prompt contains agent definition content from disk
  - Prompt contains diff content read from diff_path
  - Prompt contains convention pack content from disk
  - Prompt contains static confinement rule, prohibitions,
    and response contract text
  - Prompt contains AGENTS.md and constitution content
  - Optional sections omitted when not provided
  - Optional sections included when provided
  - Returns error when diff_path is not readable
  - Returns error when agents array is empty
  - Handles missing convention packs directory gracefully
  - Handles missing agent definition file gracefully
  - Output prompts array matches input agents order
  Files: `.opencode/test/build-review-prompts.test.ts`

- [ ] 3.2 [P] Update `scratch-smoke.test.ts` expected
  tool count from 9 to 10, add `build_review_prompts`
  to tool name list.
  Files: `.opencode/test/scratch-smoke.test.ts`

- [ ] 3.3 [P] Update `plugin-integration.test.ts`
  expected tool count from 9 to 10, add
  `build_review_prompts` to tool name list.
  Files: `.opencode/test/plugin-integration.test.ts`

## 4. Verification

- [ ] 4.1 Run `make plugin-test` — all tests pass,
  branch coverage >= 85%.

- [ ] 4.2 Run `make check` — full CI parity (Go lint,
  vet, test, build, coverage-gate, plugin tests).

- [ ] 4.3 Verify constitution alignment: tool produces
  self-contained artifacts (Principle I), has no mandatory
  external dependencies (Principle II), returns structured
  machine-parseable output (Principle III), is testable
  with fixture files and no external services
  (Principle IV).
