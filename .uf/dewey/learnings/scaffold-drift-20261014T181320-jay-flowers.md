---
tag: scaffold-drift
author: jay-flowers
category: pattern
created_at: 2026-10-14T18:13:20Z
identity: scaffold-drift-20261014T181320-jay-flowers
tier: draft
---

When reviewing changes in repos with scaffold-mirrored file pairs (live .opencode/ tree plus internal/scaffold/assets/ embed), the diff's `index <old-blob>..<new-blob>` lines give a zero-cost byte-parity check: if the live file and its mirror show the SAME hash pair, their before- and after-blobs are identical (git blob hashes are content digests), proving the mirror was updated in lockstep without running shasum. Verified during fix-tui-git-output-leak review (uf-workflow pair 6f296fc8..b2316428, uf-finale pair 74aaf626..a78cbeef, uf.finale.md pair 34beb24e..0f2196ad), corroborated by TestEmbeddedAssets_MatchSource. Caveats: diff index hashes are abbreviated, so treat this as a quick review-time check rather than a gate replacement, and hash parity only proves content parity — confirm the two paths actually form a mirror pair before relying on it.
