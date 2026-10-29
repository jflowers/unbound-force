---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-29T15:47:38Z
identity: content-pipeline-20261029T154738-jay-flowers
tier: draft
---

Content-pipeline dispositions with family-relative rationale (e.g., "complements the existing command set, below the blog significance threshold") expire silently when the referenced family completes: the disposition carriers (docs-sync tracking issues) close on sync completion and carry no content follow-up, so nothing re-surfaces the assessment when its premise changes. When recording a decline whose rationale depends on an incomplete family, anchor a revisit trigger at disposition time — a note on the family-completion issue or on the live docs tracker before it closes — so the significance assessment is re-run at the premise-changing event. Observed on opsx/uf-fix-ci (PR #868): the blog decline's premise (/uf.rebase-pr #851 unimplemented) had no revisit trigger, while the tutorial disposition was correctly re-anchored to a live issue (#870) after round-1 review; complements content-pipeline-20261029T115034 (sibling disposition cross-check) by adding the temporal dimension.
