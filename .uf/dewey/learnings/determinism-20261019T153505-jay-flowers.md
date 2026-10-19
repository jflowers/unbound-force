---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-19T15:35:05Z
identity: determinism-20261019T153505-jay-flowers
tier: draft
---

Single-sourcing a textual grammar can be pinned as an executable gate, not just a convention: a test that reads the module's own source (via vi.importActual around a node:fs mock, path resolved from the test file's URL so it never depends on CWD) and asserts (a) the deleted duplicate constant name is absent, (b) the escaped grammar literal appears exactly once, and (c) the shared constant is declared exactly once. Any reintroduced second grammar — under any constant name — must carry a second escaped literal and fails the count. This converts a DRY convention into a regression test and is the enforcement complement to extracting the grammar to one shared constant (Principle VI). Pattern shipped in .opencode/test/unleash-clarify.test.ts "plugin source grammar single-sourcing".
