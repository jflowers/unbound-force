---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-15T16:47:23Z
identity: uf-unleash-20261015T164723-jay-flowers
tier: draft
---

`.specify/scripts/bash/check-prerequisites.sh` does not support a `--require-spec` flag despite `/uf.unleash` Step 1 (uf.unleash.md ~L124) invoking it as `check-prerequisites.sh --json --require-spec`. The script's argument parser supports only `--json`, `--require-tasks`, `--include-tasks`, `--paths-only`, and `--help`; any unknown option exits 1 with "ERROR: Unknown option". The script also unconditionally requires plan.md to exist, so it cannot validate spec.md existence at branch-gate time on a fresh Speckit branch (plan.md is generated later by Step 2). Any tool or spec that codifies the `--require-spec` invocation inherits a deterministic failure; the gate must either extend the script with a spec-validation mode that skips the plan.md check, or check spec.md existence directly the way the OpenSpec path checks tasks.md.
