---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-17T14:22:14Z
identity: review-dispatch-20261017T142214-jay-flowers
tier: draft
---

Changed-files manifests can err in the opposite direction from omission: listing a phantom path that does not exist in the tree. In the unleash-deterministic-tools council, the manifest listed .uf/dewley/learnings/uf-workflow-testing-20261016T225130-jay-flowers.md (typo "dewley") while the diff showed the correct .uf/dewey/ path. Verification gotcha: glob patterns do not traverse hidden dot-directories — glob(".uf/dewey/**") and glob("**/uf-workflow-testing-20261016T225130*") both returned "No files found" for a file that demonstrably exists; only a direct read of the full path (and a parent-directory listing) confirmed the tree was clean. When a manifest path disagrees with the diff path, or globs come back empty for dot-directory paths, verify with a direct read or a directory listing of the parent before flagging a finding — a manifest-vs-diff path mismatch alone is evidence of a payload transcription error, not a repo defect. Extends review-dispatch-20261016T162808 (manifest omission) to the phantom-path case and adds the glob hidden-directory limitation to the verification method.
