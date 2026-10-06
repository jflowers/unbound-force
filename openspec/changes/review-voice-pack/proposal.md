## Why

The `/uf.review-pr` and `/uf.address-feedback` commands produce findings and
reply comments in a fixed prose style. There is no mechanism in the convention
pack system for users to customize the review voice — sentence style, framing
approach, or tone. Users who want a different review voice must edit the
scaffolded command file directly, which `uf init` overwrites on upgrade.

The convention pack system already supports language-specific code quality packs
(`go.md`, `typescript.md`, `python.md`) with `-custom.md` override files that
survive `uf init`. The same pattern should extend to review output formatting so
users can maintain their preferred review voice across upgrades.

## What Changes

1. Ship a canonical `review-voice.md` convention pack with neutral Socratic
   review tone defaults (sentence length guidance, diagnostic-question framing,
   severity signaling through specificity, summary as assessment not inventory).
2. Ship a `review-voice-custom.md` empty extension file that survives `uf init`
   so users can add project-specific voice rules.
3. Update the scaffold engine (`scaffold.go`) to deploy these as always-deployed
   packs alongside `default.md`, `severity.md`, `content.md`, etc.
4. Update `/uf.review-pr` Step 3.9 to load `review-voice.md` and its custom
   override, and add directives to Steps 7 and 9 to apply voice rules to prose
   output: findings, summary text, verdict justification, and GitHub comment
   bodies. Exclude CI tables, walkthrough tables, and tool output.
5. Update `/uf.address-feedback` to apply voice rules to reply comment prose
   when composing accept/modify/reject/ask replies. Since the command already
   loads all packs via glob, `review-voice.md` is automatically available.

## Capabilities

### New Capabilities
- `review-voice-pack`: A repo-local `.opencode/uf/packs/review-voice.md`
  convention pack that controls prose style in review commands, scoped to
  output formatting only (not passed to child agent prompts).

### Modified Capabilities
- `review-pr-output`: Steps 7 and 9 now apply review-voice rules to findings,
  summaries, verdicts, and GitHub comment bodies.
- `address-feedback-replies`: Phase 4.5 reply comments now apply review-voice
  rules to accept/modify/reject/ask prose.

## Impact

- **New files**: `internal/scaffold/assets/opencode/uf/packs/review-voice.md`,
  `internal/scaffold/assets/opencode/uf/packs/review-voice-custom.md` (2 files)
- **Modified scaffold**: `internal/scaffold/scaffold.go` — add entries to
  `alwaysDeployedPacks`
- **Modified commands**: `internal/scaffold/assets/opencode/commands/uf.review-pr.md`
  (steps 3.9, 7, 9) and `.opencode/commands/uf.address-feedback.md` (phase 4.5)
  (2 files)
- **Deployed files**: `.opencode/uf/packs/review-voice.md` and
  `.opencode/uf/packs/review-voice-custom.md` appear in all repos after `uf init`
- **Backward compatibility**: No existing behavior changes. Without voice packs
  loaded, commands behave exactly as before. Voice rules are additive.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

Voice packs follow the same artifact-based communication pattern as existing
convention packs. The pack defines formatting rules in a file; commands read
and apply them without synchronous interaction. The `-custom.md` extension
point allows teams to collaborate on voice standards through a shared file.

### II. Composability First

**Assessment**: PASS

The review-voice pack is entirely optional. Commands function identically when
the pack is absent. The pack does not introduce any dependency on other heroes
or external services. Users can add, modify, or remove the pack independently.

### III. Observable Quality

**Assessment**: PASS

Review voice rules are documented in a Markdown file that is both human-readable
and machine-discoverable. The pack location (`.opencode/uf/packs/`) follows the
established convention, making it discoverable by tooling and automatic
detection in AGENTS.md generation.

### IV. Testability

**Assessment**: PASS

The scaffold deployment of `review-voice.md` is covered by existing scaffold
tests that verify `alwaysDeployedPacks` entries and pack deployment. Command
behavior with and without the pack can be verified through review-pr and
address-feedback integration tests.

### V. Security by Default

**Assessment**: PASS

No new dependencies, no new I/O surfaces, no privilege escalation. The pack
contains only formatting rules expressed as Markdown text.