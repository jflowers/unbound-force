---
tag: uf-workflow-checkpoint
author: jay-flowers
category: pattern
created_at: 2026-10-12T15:16:36Z
identity: uf-workflow-checkpoint-20261012T151636-jay-flowers
tier: draft
---

The vitest coverage gate for the OpenCode plugin test suite requires 85% branch coverage. When adding new plugin functionality with error paths (like symlink defense checks that throw on symlinked directories or files), the initial implementation may bring branch coverage below threshold because error branches are untested. The fix is to add targeted tests for each error branch: create actual symlinks in temp directories (using symlinkSync), then invoke the tool and assert the error response. This pattern — mkdtempSync + mkdirSync for real dirs + symlinkSync for symlink targets + tool invocation — reliably covers symlink defense branches. For the uf-workflow plugin, adding 4 symlink defense tests (checkpoint symlinked dir, get_progress symlinked file, clear_progress symlinked file, deleteState symlink check) brought branch coverage from 74% to 91%.
