---
tag: path-validation-nodejs
author: jay-flowers
category: gotcha
created_at: 2026-10-09T03:17:00Z
identity: path-validation-nodejs-20261009T031700-jay-flowers
tier: draft
---

Path validation in Node.js TypeScript plugins must use fs.realpath() (async) instead of path.resolve() (sync, lexical-only) when defending against symlink-based path traversal. The resolve() function only performs lexical normalization of path segments — it does not follow symlinks, so a symlink at /tmp/evil pointing to /etc/passwd would pass a resolve()-based check because resolve() returns /tmp/evil which is within the allowed directory. The realpath() function follows the entire symlink chain to the final target and returns the canonical path. On macOS, this is especially important because /var is actually a symlink to /private/var, so tmpdir() returns /var/folders/... but realpath() resolves to /private/var/folders/.... Both the project root and tmpdir() comparison targets must also be canonicalized via realpath() for consistent comparison. Include a catch block around realpath() for files that don't exist (ENOENT) — return path_validation_failed rather than falling through to a read attempt.
