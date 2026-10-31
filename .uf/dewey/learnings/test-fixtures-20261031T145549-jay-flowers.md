---
tag: test-fixtures
author: jay-flowers
category: gotcha
created_at: 2026-10-31T14:55:49Z
identity: test-fixtures-20261031T145549-jay-flowers
tier: draft
---

When a test builds a fixture by appending bytes to a tool-deployed file, the fixture's validity (e.g., YAML well-formedness of an appended list item) can depend on an unpinned property of the deployed artifact — such as a trailing newline — that no test asserts. Disposition and byte-identity assertions stay green even if that property regresses, so the fixture silently stops modeling the realistic scenario the spec describes while the test comment keeps claiming validity. Guard the precondition at the append site (e.g., bytes.HasSuffix(seeded, []byte("\n")) with t.Fatalf before appending) or drop the well-formedness claim from the comment. Observed in TestRun_ReviewerCapabilitiesPreservedOnRerun (internal/scaffold/scaffold_test.go), which appends a reviewers entry to the deployed .uf/reviewer-capabilities.yaml.
