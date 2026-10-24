---
tag: content-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-24T15:01:01Z
identity: content-pipeline-20261024T150101-jay-flowers
tier: draft
---

A change that inserts or renumbers steps in a command file must also update the command's own self-descriptions — the frontmatter `description:` block (the command-picker text users see) and the `## Description` activity enumeration. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR 812, 2026-10-24): the change inserted a step-4 "Sync with Base Branch" and refreshed every downstream surface (docs, CHANGELOG, gate issues, golden anchors), but the frontmatter still read "commit, push, create PR, watch CI checks, and return to main" and the description still read "Stages, commits, pushes, creates a PR, watches CI, and returns to `main`" — the new step was absent from the most user-visible summary of the command. Number-scoped cross-reference audits (grep for step numbers, step counts, historical spellings) never touch numberless prose enumerations, which is exactly why these lines escaped three audit passes. Recipe: after any step insertion/removal, grep the command file's own description fields for the activity enumeration and extend them in the same commit; then sync the scaffold mirror byte-identically (cp + diff). Note the line-count constraint: frontmatter folded blocks and description prose must rewrap within the file's existing line budget so downstream line anchors (golden census sites) do not shift — prefer the change's canonical vocabulary as a compact verb form (e.g. "base-syncs") over dropping the enumeration or the lead sentence.
