# router-pattern-codification — Measured Deltas (DE-004)

Static metrics for both edited files, per design decision 5.
Baseline captured via `git show` of the pre-change commit
(`1bfd363798e869f5ea83276cdfbfb46d5f1009e9`); after counts
from the working tree post-implementation, following the
`command-prose-pilot` `metrics.md` precedent.

## Determinism pack (.opencode/uf/packs/determinism.md)

| Metric | Before | After | Delta |
|---|---|---|---|
| Line count (`wc -l`) | 62 | 90 | +28 |
| Word count (`wc -w`) | 304 | 483 | +179 |

## Determinism-first skill (.opencode/skills/determinism-first/SKILL.md)

| Metric | Before | After | Delta |
|---|---|---|---|
| Line count (`wc -l`) | 74 | 107 | +33 |
| Word count (`wc -w`) | 401 | 648 | +247 |

### Notes

- The pack delta is the appended `## Intent-Level
  Orchestration` section (28 lines) plus the version line and
  severity-mapping sentence edits — the only modified lines;
  everything else is byte-unchanged (task 2.4 verifies).
- The skill delta is the new `## Chains Without Judgment
  Collapse Too` section plus the five enumerated prose updates.
- The design risk estimate (~28 pack lines, ~20 skill lines)
  matched the pack exactly; the skill landed at +33 lines,
  within the same order the determinism-codification change
  accepted (~30 lines) for equivalent rule coverage.
