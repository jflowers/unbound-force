---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T12:46:32Z
identity: scaffold-pin-tests-20261025T124632-jay-flowers
tier: draft
---

PR 815 (unleash-build-test-fix-loop) recurred the per-wiring-site pin gap after it was codified in learning test-quality-20261024T160650: the build/test fix loop was wired at two Step 5 sites of uf.unleash.md (quick-tier pre-flight gate :781, phase checkpoint :1170) but pinned with a single span-level strings.Contains on the shared lowercase phrase. The capitalized loop-block header (:879, "**Build/test fix loop**") dodged the pin, the phase-checkpoint wiring and its green-supersession instruction went unguarded, and the new prompt-only uf_delegate_command loop call site lacked the prescribed delegation-shape subtest. Mechanical derivation closes the class at authoring and review time: grep the changed command asset for the feature phrase — each occurrence site requires one distinct pin phrase unique to that site — and each new prompt-only uf_delegate_command call site requires a loop-scoped delegation-shape subtest (precedent scaffold_test.go:430-444). Run the grep before approving any pin subtest whose name or comment names multiple gates or call sites.
