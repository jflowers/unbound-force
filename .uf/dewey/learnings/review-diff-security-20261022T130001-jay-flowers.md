---
tag: review-diff-security
author: jay-flowers
category: pattern
created_at: 2026-10-22T13:00:01Z
identity: review-diff-security-20261022T130001-jay-flowers
tier: draft
---

The `capture_review_diff` tool in `.opencode/lib/review-diff.ts` demonstrates a comprehensive defense-in-depth pattern for file capture tools: (1) Zod schema validation with `isSafeRelativePath` refine rejecting absolute paths and `..` segments at the boundary, (2) `lstat` (not `stat`) for symlink detection before reading, (3) per-file size cap (256KB), total new-file byte budget (1MB), total diff size cap (8MB), and file count cap (200), (4) binary file detection via null-byte check, (5) exclusive-create write (`wx` flag) with 0o600 permissions and 0o700 directory permissions, (6) deterministic diff path using `randomUUID()` in a controlled temp directory. This layered approach prevents path traversal, symlink following, resource exhaustion, and TOCTOU races on the output file.
