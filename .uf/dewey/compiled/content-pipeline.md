---
tier: validated
compiled_at: 2026-10-25T16:39:19Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - content-pipeline-20261017T232053-jay-flowers
  - content-pipeline-20261020T125031-jay-flowers
  - content-pipeline-20261022T192850-jay-flowers
  - content-pipeline-20261022T205117-jay-flowers
  - content-pipeline-20261023T114010-jay-flowers
  - content-pipeline-20261023T120154-jay-flowers
  - content-pipeline-20261023T133532-jay-flowers
  - content-pipeline-20261023T145632-jay-flowers
  - content-pipeline-20261023T171914-jay-flowers
  - content-pipeline-20261023T202101-jay-flowers
  - content-pipeline-20261024T150101-jay-flowers
topic: content-pipeline
---

# Content Pipeline

## Current State (October 2026)

### Verifiable dispositions

- Content coverage must be an explicit, verifiable disposition: cite the
  coverage vehicle by issue number, delegate filing to a committed task
  that re-runs duplicate checks in the source repo and
  unbound-force/website at filing time, and record repo-qualified issue
  numbers in the change record. Bare yes/no assessments do not close
  triage. Exemplar: delegation-skill-enforcement tasks 5.4/5.5 (#791,
  website#317, replicator#143, tracker #742). Not yet codified in
  templates/commands — the de facto standard, still advisory.
- The documentation gate has two issue halves that tasks.md planning
  collapses: the in-repo docs issue (label docs) and the unbound-force/
  website issue (org constitution Cross-Repo Documentation rule), both
  filed before the implementing PR merges. OpenSpec tasks for user-visible
  changes model the full set — CHANGELOG entry, in-repo docs issue,
  website issue, tutorial issue only for a new multi-step workflow
  (canonical: #751 tasks 8.4-8.7); scaffolded-surface changes get their
  doc tasks diffed against it — partial enumeration narrows the gate.

### Significance thresholds

- Thresholds decide the blog moment: a new agent, command, executed
  migration, or hero capability crosses them. Pilots with deferred
  promotion phases sit below every threshold; their before/after deltas
  and comprehension A/B become evidence material for the promotion
  change. Promotion changes (skill or convention-pack additions) cross
  every threshold at once — a convention-pack addition requires a website
  documentation issue, not exempt. Record a disposition in the pilot's
  follow-ons (deferred items or a dated maintainer exemption); an
  unrecorded disposition reads as "not considered."
- Announcing an unpromoted standard is premature when validation evidence
  is directional (small-sample A/B with methodology deviation); the old
  FA-006 citation was phantom — the pack holds only FA-001..FA-004.
- Quality-gate/CI-only changes are exempt from the documentation issue
  but must show four-artifact provenance: gate-config provenance comment,
  CHANGELOG entry, AGENTS.md convention bullet, explicit exemption claim
  in proposal/tasks. Exemplar: ts-plugin-coverage-gate #780 (statements
  floor 90→94). Repair changes compare significance against the pre-break
  baseline and may still need issues when user-visible behavior changes.

### Reviewer verification discipline

- Reviewers verify recorded numbers, never re-derive them: per-repo
  keyword/label search is blind to cross-repo filings (false-positive
  HIGHs); one read-only `gh issue view <N> --repo <owner>/<repo>` per
  recorded number confirms existence, open state, and title. The gate
  binds before PR merge, not spec review; filing defers to PR time.
- Learnings' tracker snapshots are historical testimony of learning-
  creation time; re-verify live state and cite the verification command's
  output — not the learning — as finding evidence (#810 and website#320
  gained the docs label after their learning was written).
- Step-renumbering changes have repo-wide blast radius: grep the command
  name everywhere; classify hits outside the command file and its scaffold
  mirror as step-number, step-sequence, or line-anchor references;
  disposition each historical vs live (all tasks.md checkboxes [x] plus
  both review-passed markers = implemented-but-unarchived under D9
  spec-immutability, leave stale; otherwise live); update the command's
  own description fields in the same commit — number-scoped audits never
  touch numberless prose — rewrapping within the existing line budget so
  golden line anchors do not shift; sync the scaffold mirror
  byte-identically.

### Persona routing

- Personas envoy/herald/scribe: discovered but not dispatched for review;
  skip the full council for validated content types after 3+ reviews.

## History

- 2026-10-17 — pilot-below-threshold rule: blog/tutorial obligations
  attach to the promotion change, not the pilot; cited "rule FA-006."
- 2026-10-20 — always-assess supersedes pilot-only reasoning:
  unleash-tier-routing shipped a significant capability with every docs
  gate satisfied but no blog/tutorial evaluation anywhere.
- 2026-10-22 — bare yes/no superseded by verifiable dispositions
  (delegation-skill-enforcement shape); four-artifact provenance for
  exempt quality-gate changes (#780).
- 2026-10-23 — reviewer discipline consolidates: cross-repo keyword
  blindness, verify-recorded-numbers recipe, #751 four-task template,
  two issue halves (website#319), snapshots, step-renumbering (PR 812).
- 2026-10-24 — command self-description gap: frontmatter/Description
  enumerations escaped three number-scoped audits; same-commit rule.
- 2026-10-25 audit — FA-006 confirmed phantom (pack holds only
  FA-001..FA-004); premature-announcement stands on directional evidence
  alone; dispositions remain advisory; personas undispatched.
