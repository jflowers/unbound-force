---
tag: scaffold-ownership
author: jay-flowers
category: gotcha
created_at: 2026-10-31T18:31:46Z
identity: scaffold-ownership-20261031T183146-jay-flowers
tier: draft
---

A scaffold ownership flip (isToolOwned true→false) cannot change the fresh-directory deploy count: first deploy creates every embedded asset regardless of ownership, and ownership only affects re-run disposition (Skipped vs Updated). So when a diff that flips an ownership classification also changes a files-processed count expectation (unbound-force opsx/reviewer-capabilities-init-survival: embedded assets 76→78, TestRunInit_FreshDir range [71-75]→[73-77]), the count delta always originates outside the flip — typically a stale base expectation that the range's environment tolerance masked until a probe-complete CI-parity run (base 73 + 4 activation probes = 77) exceeds the old ceiling. Implementers should record the re-derivation's justification (what the prior count predated, why the range moved) in the CHANGELOG entry or the change's design notes, and reviewers should ask for that justification, so the correction stays traceable instead of reading as unexplained scope inside the ownership change.
