---
tag: plugin-staging
author: jay-flowers
category: reference
created_at: 2026-10-16T22:37:39Z
identity: plugin-staging-20261016T223739-jay-flowers
tier: draft
---

A staging-closure test that pins a hand-maintained asset list against plugin imports must walk the import graph transitively, not just entry-point specifiers. .opencode/lib/review-dispatch-lesson-proposal.ts imports './review-dispatch-sibling-evidence.js', so extracting only '../../lib/*.js' specifiers from the four staged plugin sources misses a future lib module imported solely by another lib module. Derive the expected set by following relative specifiers through every staged file, then assert against observable staging output — invoke stageReviewPluginSources into a temp stage root via the injectable Options (the existing MkdirTemp fake in plugin_activation_test.go:170 already captures stageRoot) and os.Stat each derived lib/<name>.ts path — instead of re-asserting a copied list, which relocates the hand-maintenance rather than eliminating it. The existing staged-path assertion at plugin_activation_test.go:139-147 is a hand-enumerated 5-of-12 subset and is the natural extension point for the derived full-inventory check.
