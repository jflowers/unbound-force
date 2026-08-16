---
tag: scaffold
author: jay-flowers
category: pattern
created_at: 2026-08-16T18:15:01Z
identity: scaffold-20260816T181501-jay-flowers
tier: draft
---

When adding a new programmatically-generated config file to the scaffold engine (like dcp.jsonc), the implementation pattern is: (1) create a configureFoo() function following the configureOpencodeJSON() pattern with identical signature (opts *Options) []subToolResult, (2) add the call site in initSubTools() after configureOpencodeJSON using collect(), (3) add the file to knownNonEmbeddedFiles in scaffold_test.go to prevent drift test failures, (4) update all existing initSubTools test result count assertions (there are 5+ tests that check specific result slice lengths and indices). The dcpConfigContent constant approach (raw string const rather than embed.FS) is appropriate for small, fixed-content files that don't vary across projects -- it avoids adding the file to the embed directive, asset manifest, and drift detection infrastructure.
