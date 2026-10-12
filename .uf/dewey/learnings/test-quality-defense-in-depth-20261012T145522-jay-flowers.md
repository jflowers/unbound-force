---
tag: test-quality-defense-in-depth
author: jay-flowers
category: pattern
created_at: 2026-10-12T14:55:22Z
identity: test-quality-defense-in-depth-20261012T145522-jay-flowers
tier: draft
---

When testing defense-in-depth security layers (like path traversal checks behind input sanitization), consider testing each layer independently. If the outer layer (sanitization) prevents dangerous inputs from reaching the inner layer (path traversal check), the inner layer has no regression protection. Export the inner function for testing, or create a test that bypasses the outer layer to verify the inner layer works correctly. This is especially important when the two layers are in different functions that could be refactored independently.
