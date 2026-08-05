# Tasks: Fix review-pr Step 7 verdict-posting gate

<!-- [P] marks parallel-eligible tasks -->

status:: ready

## Group 1: Fix Step 7 gating logic

- [x] 1.1 In `.opencode/commands/uf.review-pr.md`, restructure
  Step 7 so the HIGH+ severity condition gates only the
  introductory framing text, not the `AskUserQuestion`.
  The `AskUserQuestion` must execute unconditionally
  within Step 7.

## Group 2: Verify fix

- [ ] 2.1 Run `/uf.review-pr` against a PR with only MEDIUM/LOW
  findings and confirm Step 7 presents the
  `AskUserQuestion`. Pass: agent output includes the
  verdict-posting prompt and does not include the finding
  count summary. Fail: Step 7 is skipped or framing text
  appears.
- [ ] 2.2 Run `/uf.review-pr` against a PR with zero findings
  and APPROVE verdict and confirm Step 7 presents the
  `AskUserQuestion` without framing text. Pass: agent
  output includes the verdict-posting prompt but no
  finding count summary. Fail: Step 7 is skipped.
- [ ] 2.3 Run `/uf.review-pr` against a PR with HIGH+ findings
  and confirm both the framing text and `AskUserQuestion`
  appear. Pass: agent output includes both the finding
  count summary and the verdict-posting prompt.

<!-- spec-review: passed -->
<!-- code-review: passed -->
