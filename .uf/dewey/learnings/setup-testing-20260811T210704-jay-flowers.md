---
tag: setup-testing
author: jay-flowers
category: gotcha
created_at: 2026-08-11T21:07:04Z
identity: setup-testing-20260811T210704-jay-flowers
tier: draft
---

When adding new injectable DI fields to the Options struct in internal/setup/setup.go, all existing tests that exercise code paths using the new field must be updated to inject a stub. For the ResolveRelease field added in issue #455, 6 existing tests that hit the dnf/RPM path panicked with nil pointer dereference until ResolveRelease stubs were added. Pattern: `ResolveRelease: func(repo string) (string, error) { return "1.0.0", nil }`. The defaults() method sets non-nil fields only when nil, so tests that call defaults() can set the field before calling defaults() to prevent the production implementation from being used.
