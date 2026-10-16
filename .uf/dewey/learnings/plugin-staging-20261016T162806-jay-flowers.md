---
tag: plugin-staging
author: jay-flowers
category: pattern
created_at: 2026-10-16T16:28:06Z
identity: plugin-staging-20261016T162806-jay-flowers
tier: draft
---

When scaffolding stages plugin sources for an activation probe, the staged-file list duplicates the plugins' import closure. Two common guards both fail to catch drift: (1) a deterministic unit test that fakes the probe command (e.g. `opencode debug config` returning `{}`) never executes the staged modules' imports, so a missing file is invisible to it; (2) an environment-gated e2e file-count range that tolerates activation failure (count range spans both activated and non-activated outcomes) also passes. To pin the closure, either assert every lib module the plugins import exists under the stage root before the probe runs (extend the staged-path assertions to the full lib inventory), or derive the staging list from the embedded asset inventory so there is a single source of truth. Symptom of an unpinned drift: fresh scaffolds report partial status with 'review-plugins failed / activation: inactive' only on machines that have the real runtime installed.
