---
tag: spec-authoring
author: jay-flowers
category: pattern
created_at: 2026-10-17T23:47:12Z
identity: spec-authoring-20261017T234712-jay-flowers
tier: draft
---

When piloting a new standard against an existing artifact, enumerate the standard's generic validation scenarios against the pilot artifact before approving the change — a scenario can be stricter than its requirement's intent. In command-prose-pilot, the ALL-CAPS inventory scenario ("every one is an RFC 2119 keyword, a glossary control verb, a tool name, code, or a path") nominally fails against the pilot file's preserved "SESSION-RESUME GUARD" block title and "PR"/"CI" acronyms, which behavioral-preservation rules require keeping; the pilot's own spec quietly resolved this by enumerating a conformance subset that omitted the Normativity Style requirement, but the exclusion was undocumented. When a pilot's conformance spec deliberately scopes to a subset of the referenced standard, record which requirements are excluded and why (in the spec or design), so later reviewers applying the standard generically do not false-positive against preserved behavior. Restatement drift runs in both directions: token lists drifting between artifacts, and applicability scope drifting between a standard's generic scenarios and a pilot's scoped conformance requirement.
