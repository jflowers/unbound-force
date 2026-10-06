<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Scaffold Pack Assets

- [ ] 1.1 Create `internal/scaffold/assets/opencode/uf/packs/review-voice.md` with canonical Socratic voice rules (sentence style, diagnostic-question framing, severity signaling through specificity, summary/verdict patterns). Content sourced from `~/.config/opencode/skills/review-voice/SKILL.md`.
- [ ] 1.2 [P] Create `internal/scaffold/assets/opencode/uf/packs/review-voice-custom.md` as an empty extension file with `pack_id: review-voice-custom` frontmatter and the `<!-- Add project-specific rules below this line -->` sentinel.

## 2. Scaffold Engine

- [ ] 2.1 Add `"review-voice": true` and `"review-voice-custom": true` to `alwaysDeployedPacks`, and add both pack filenames to the `collectDeployedPacks` candidates list in `internal/scaffold/scaffold.go` so deployment and generated AGENTS.md listings stay in sync.

## 3. Review-PR Command

- [ ] 3.1 Update Step 3.9 in `internal/scaffold/assets/opencode/commands/uf.review-pr.md` to load `review-voice.md` and `review-voice-custom.md` alongside existing packs. Voice packs are retained for output formatting but explicitly NOT passed to child agent prompts.
- [ ] 3.2 Add voice-application directive to Step 7 (Output Format) instructing the agent to apply review-voice rules to all prose (findings, summary, verdict justification) and exclude structured tables and tool output.
- [ ] 3.3 Add voice-application directive to Step 9 (Offer Verdict-aligned PR Review) for GitHub comment bodies and inline comments.

## 4. Address-Feedback Command

- [ ] 4.1 Add voice-application directive to Phase 4.5 (Reply Comments) in `.opencode/commands/uf.address-feedback.md` instructing the agent to apply review-voice rules to accept/modify/reject/ask reply prose, and exclude feedback-triage JSON artifact content.

## 5. Tests

- [ ] 5.1 [P] Verify scaffold tests pass for pack deployment — confirm `alwaysDeployedPacks` entries, pack creation in test output, and `-custom.md` survival on ordinary `uf init`.
- [ ] 5.2 [P] Add or update scaffold test assertions for `review-voice.md` and `review-voice-custom.md` deployment in `TestRun` tests.

## 6. Verification

- [ ] 6.1 Run `make check` — confirm all tests, lint, build, and coverage gates pass.
- [ ] 6.2 Verify constitution alignment per proposal: Autonomous Collaboration, Composability First, Observable Quality, Testability, Security by Default — all PASS per proposal.
