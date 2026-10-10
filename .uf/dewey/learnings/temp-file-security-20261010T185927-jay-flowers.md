---
tag: temp-file-security
author: jay-flowers
category: gotcha
created_at: 2026-10-10T18:59:27Z
identity: temp-file-security-20261010T185927-jay-flowers
tier: draft
---

When using Node.js `open(path, 'wx', mode)` for exclusive-create temp file security on macOS, be aware that 'wx' (O_CREAT|O_EXCL) does NOT imply O_NOFOLLOW on macOS — unlike Linux where O_EXCL on the final path component prevents symlink following. On macOS, an attacker who controls the parent directory can create a symlink between unlink() and open('wx'), causing the file to be written through the symlink. The Node.js `fs` API does not expose O_NOFOLLOW directly. Mitigations: (1) use `mkdtemp()` to create a unique parent directory instead of a shared predictable one, (2) verify parent directory ownership/permissions after mkdir, or (3) use `fs.realpath()` to canonicalize the path and verify it's within the expected directory before writing.
