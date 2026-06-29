## ADDED Requirements

### Requirement: Review Context Skill Invocation

The `/review-pr` command MUST invoke the `review-context`
skill via the `skill` tool at Step 6, after fetching the
diff (Step 5) and before loading convention packs
(Step 7).

The invocation MUST execute all four protocols:

1. Protocol 1 (Spec Artifact Discovery)
2. Protocol 2 (Issue Linking)
3. Protocol 3 (Path-Based Focus Heuristics)
4. Protocol 4 (Walkthrough Generation)

The skill's output MUST be recorded for use in Step 8
(AI Review) and Step 9 (Output).

#### Scenario: Skill loaded successfully

- **GIVEN** the `review-context` skill exists at
  `.opencode/skills/review-context/SKILL.md`
- **WHEN** `/review-pr` reaches Step 6
- **THEN** the command invokes the `skill` tool with
  name `review-context` and executes Protocols 1-4
  using PR metadata from Step 2 and the saved diff
  from Step 5

### Requirement: Step 8 Consumes Skill Output

Step 8 (AI Review) MUST reference the file
classifications and walkthrough summaries produced by
Step 6 (review-context skill, Protocols 3 and 4)
instead of computing them inline.

Security review (Step 8b) MUST continue to apply to
ALL changed files regardless of path heuristic.

Behavioral verification is manual — run `/review-pr`
against a reference PR before and after the change to
confirm output parity. This is consistent with the
verification approach used for the `pre-flight` skill
extraction. The scaffold drift test provides the
automated verification layer.

#### Scenario: Path focus applied from skill output

- **GIVEN** Step 6 produced file classifications via
  Protocol 3
- **WHEN** Step 8 reviews a file classified as
  `security`
- **THEN** the review applies the `security` focus
  emphasis (auth, input validation, injection) as
  additive context alongside standard review categories

## MODIFIED Requirements

### Requirement: Forward References to Issue Linking

Previously: Step 8a referenced "linked issues
(Step 6a)" and the Linked Issues output section
referenced "Step 6a".

All references to "Step 6a" MUST be updated to
reference "Step 6" or "Step 6, Protocol 2" as
appropriate. Specifically:

- Step 8a acceptance criteria coverage MUST reference
  "Step 6, Protocol 2" instead of "Step 6a"
- The Linked Issues output section MUST reference
  "Step 6" instead of "Step 6a"

#### Scenario: Acceptance criteria coverage reference

- **GIVEN** the inline Step 6a has been removed
- **WHEN** Step 8a performs acceptance criteria coverage
- **THEN** the instruction references linked issues
  from "Step 6, Protocol 2"

### Requirement: Address-Feedback Context Discovery

Previously: `/address-feedback` Step 2.1 item 6 read:
"If `review-context` convention pack exists, use it
for standardized discovery. Otherwise inline the
discovery logic above."

The `/address-feedback` command MUST reference the
`review-context` skill (not "convention pack") as a
hard dependency for context discovery in Step 2.1.

#### Scenario: Address-feedback loads skill

- **GIVEN** `/address-feedback` reaches Step 2.1
- **WHEN** loading project context
- **THEN** item 6 instructs the agent to invoke the
  `skill` tool with name `review-context` for
  standardized context discovery

### Requirement: Scaffold Sync

All changes to live command files MUST be mirrored to
their scaffold copies under
`internal/scaffold/assets/opencode/commands/`. The
drift detection test (`TestEmbeddedAssets_MatchSource`)
MUST pass.

#### Scenario: Scaffold copies match live files

- **GIVEN** changes are made to
  `.opencode/commands/review-pr.md` and
  `.opencode/commands/address-feedback.md`
- **WHEN** `make test` is run
- **THEN** `TestEmbeddedAssets_MatchSource` passes,
  confirming scaffold copies are identical

## REMOVED Requirements

### Requirement: Inline Spec Discovery (Steps 6, 6a)

The inline spec discovery logic (branch name matching,
PR description parsing, changed-file detection) and
issue linking logic (regex parsing, validation,
fetching, sanitization, acceptance criteria extraction)
are removed from `/review-pr`. These capabilities are
now provided by the `review-context` skill Protocols 1
and 2.

### Requirement: Inline Path Heuristics and Walkthrough

The inline path-based focus heuristic table and
walkthrough generation instructions are removed from
the Step 8 preamble. These capabilities are now
provided by the `review-context` skill Protocols 3
and 4.

### Requirement: Graceful Degradation for Absent Skill

No graceful degradation or inline fallback is
implemented for the `review-context` skill. The skill
is a hard dependency, consistent with the `pre-flight`
skill consumption pattern across all consumers.
