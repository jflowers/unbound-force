---
tag: shared-library-extraction
author: jay-flowers
category: pattern
created_at: 2026-10-12T00:53:43Z
identity: shared-library-extraction-20261012T005343-jay-flowers
tier: draft
---

When extracting shared functionality from one plugin to a shared library (agent-executor.ts), private types that depend on plugin-specific SDK types (like CurrentMessageResponse = Awaited<ReturnType<PluginInput["client"]["session"]["message"]>>) can be safely moved because they derive from the same SDK types available in both locations. The key design pattern is creating a context interface (HostResolutionContext) that captures only the needed dependencies rather than passing the full plugin context, making the extracted function usable from multiple call sites without tight coupling.
