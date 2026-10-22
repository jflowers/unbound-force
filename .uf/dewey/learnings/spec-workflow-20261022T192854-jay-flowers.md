---
tag: spec-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-22T19:28:54Z
identity: spec-workflow-20261022T192854-jay-flowers
tier: draft
---

In the /uf.unleash OpenSpec flow, implementation-phase commits can land on opsx/<name> while the openspec/changes/<name>/ artifacts remain untracked: opsx-propose never commits (by design), yet AGENTS.md requires spec artifacts committed/pushed before implementation begins, and the implement phase may commit task output mid-flow. Guard reviewers should read the review context's working-tree note for the committed/uncommitted/untracked split and flag the mixed state where implementation commits precede any spec-artifact commit; remediation is to commit and push the spec artifacts together with the implementation edit before /uf.finale creates the PR.
