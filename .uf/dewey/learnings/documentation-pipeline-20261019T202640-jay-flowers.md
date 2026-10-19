---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-19T20:26:40Z
identity: documentation-pipeline-20261019T202640-jay-flowers
tier: draft
---

A docs-correction change must grep the false claim's signature text across every file that names the tool — not just the sections enumerated in the spec's sibling list — and verify the CHANGELOG's scope sentence with a fresh grep at head SHA before commit. False claims about a shared tool's output live at two structural sites per command: the call-site description (\"The tool returns <fields>...\") and the consumption site (\"use the <field> from...\"); a sibling scope derived from one site misses the other. Observed in PR 761 (fix-triage-issue-dispatch-docs, head 1800eaa8): FR-005/tasks 1.5-1.7 enumerated only the Store Lesson Proposals and finalization sections of uf.review-council and uf.address-feedback, so the identical false dispatch-output sentence survived at review-council §2 (lines 276-278) and address-feedback §2.3.4 (lines 358-360) while its correction landed in §4/§2.3.7 of the same files — the exact claim issue #735 gap 1 was filed against, coexisting with its correction — and the CHANGELOG entry, authored from the task list, claimed all four commands documented the counts-only contract when only two did. Recipe: (1) extract the claim's signature sentence before editing; (2) grep it across all command files AND their scaffold mirrors; (3) triage every hit into the documentation-pipeline-20261019T182348 three buckets (needs the same correction / inherits by citation / makes no claim); (4) after editing, re-grep at head SHA and require zero surviving hits before writing any CHANGELOG scope sentence. Extends learnings documentation-pipeline-20261019T182348 and review-dispatch-20261019T182355 with the two-sites observation and the changelog-verification step.
