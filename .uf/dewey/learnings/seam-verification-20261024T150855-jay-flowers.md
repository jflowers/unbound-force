---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-24T15:08:55Z
identity: seam-verification-20261024T150855-jay-flowers
tier: draft
---

A tool failure envelope that documents a value invariant (e.g. 'behindBy decides the gate and MUST NOT silently read as 0') must be validated against every path that produces the value, not only the exec-throw path — numeric coercion fallbacks like `parseInt(x, 10) || 0` convert unparseable-but-successful command output into the invariant's sentinel value, silently suppressing the gate the envelope was hardened to protect. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR 812, 2026-10-24): uf_finale_base_state routes `git rev-list --count` exec failures through the retryable BASE_SYNC_COUNT envelope, but the parse step still coerces NaN to 0 via `|| 0`, so a zero-exit garbage output would present behindBy: 0 and skip the sync gate — the exact silent-zero the code comment forbids. Real-world git makes the path near-impossible (rev-list --count always emits an integer), so severity stays LOW. Recipe: when hardening a failure envelope, enumerate the value's full production chain (exec throw, parse, coercion, default) and route every non-valid production through the envelope — e.g. a Number.isFinite check mapping parse failures to the same failure code. Complements seam-verification-20261023T202104 (wire the consumption side) by extending the audit from error codes to value invariants.
