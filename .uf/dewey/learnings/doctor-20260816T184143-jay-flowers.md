---
tag: doctor
author: jay-flowers
category: pattern
created_at: 2026-08-16T18:41:43Z
identity: doctor-20260816T184143-jay-flowers
tier: draft
---

When adding a new doctor health check to the Unbound Force doctor command, the established pattern is: (1) create a checkFoo(opts *Options) CheckResult function in checks.go, (2) call it from the appropriate group function (e.g., checkScaffoldedFiles) via group.Results = append(group.Results, checkFoo(opts)), (3) use opts.ReadFile for file I/O to enable test injection, (4) map severity levels as Fail for missing/required items, Warn for misconfigured/optional items, and Pass for correct state, (5) always include InstallHint with actionable commands like "Run: uf init" or "Run: uf init --force", (6) update existing tests that verify the group (TestCheckScaffoldedFiles, TestDoctorRun_AllPass) to include the new file in fixture setup. Doctor checks that validate file content (not just existence) should use a pattern similar to checkAgentContext — read the file, parse/analyze, return CheckResult with specific messages for each failure mode.
