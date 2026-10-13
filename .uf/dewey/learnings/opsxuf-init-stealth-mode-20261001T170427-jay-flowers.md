---
tag: opsxuf-init-stealth-mode
author: jay-flowers
category: gotcha
created_at: 2026-10-01T17:04:27Z
identity: opsxuf-init-stealth-mode-20261001T170427-jay-flowers
tier: draft
---

Implementing `uf init --stealth` (local-only mode) in the unbound-force scaffold engine revealed a critical correctness pattern: git submodule gitlink entries (index mode 160000) must be detected and skipped during tracked-file snapshot/restore. Using plain `git ls-files -z` returns only paths, so an initialized submodule appeared via os.Lstat as a directory and the restore path's "replaced by directory" branch would os.RemoveAll the entire submodule checkout. The fix was to use `git ls-files -s -z` and parse the leading `<mode> <object> <stage>` metadata, skipping entries whose stage mode equals "160000". Always parse the full index metadata (stage mode) when snapshotting tracked files, not just the path list, because gitlink entries are directories on disk but must never be treated as replaceable regular files.
