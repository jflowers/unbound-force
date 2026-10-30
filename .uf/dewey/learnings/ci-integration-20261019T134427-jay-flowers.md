---
tag: ci-integration
author: jay-flowers
category: pattern
created_at: 2026-10-19T13:44:27Z
identity: ci-integration-20261019T134427-jay-flowers
tier: draft
---

When consuming a sibling repo's reusable GitHub Actions workflow, pin it by the full 40-char merge-commit SHA per org constitution Principle V — even when the publisher's own consumer docs recommend pinning to a release tag (gaze's ci-integration guide suggests tag pins; tags are mutable and constitutionally insufficient, and the org constitution supersedes hero-repo docs on conflict). Record the provenance in the consuming change's design.md: the source PR number, the merge SHA, and a verification run ID (gaze-ai-report: PR #300, SHA c133b118..., verified by gaze run 39239267809). This satisfies CI-002 authoring-time verification without API access at review time. Repo precedent (openspec/specs/ci "Reusable Workflow Pinning") further expects such SHAs to be managed by dependabot's github-actions ecosystem, which updates reusable workflow `uses:` refs the same as action pins. Add a version comment when a tagged release containing the workflow becomes available (e.g. `# v2.3.0`) — a comment-only refinement that does not move the pin.
