---
tag: scaffold-testing
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:22:48Z
identity: scaffold-testing-20261030T212248-jay-flowers
tier: draft
---

Go scaffold ensure* sub-tool functions (ensureGitignore, ensureAGENTSmdPackSection, ensureAGENTSmdSiblingSection) carry a reusable nine-test matrix: assert every subToolResult action string exactly (skip-no-target, skip-no-file, already-configured, configured, failed-read, failed-write via injected ReadFile/WriteFile closures), verify appended-content phrase presence plus prefix preservation of existing content, lock idempotency with double-call byte equality, cover the missing-trailing-newline synthesis edge (the section heading must start on its own line, not glue onto the last existing line), and gate Run()-level stealth behavior with a table-driven test over {stealth, normal} using initGitDir + newStealthGitFake — stealth asserts exact-content equality on the tracked file (verifying no sub-tool touched it), normal asserts the section marker appears. The DI asymmetry (os.Stat for the pure existence probe, opts.ReadFile/WriteFile for content I/O) keeps every content path injectable while the existence probe follows the agent-context scan precedent.
