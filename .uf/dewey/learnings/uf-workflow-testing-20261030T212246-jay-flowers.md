---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:22:46Z
identity: uf-workflow-testing-20261030T212246-jay-flowers
tier: draft
---

When threading executor-produced identifiers (e.g., child session ids) into tool failure envelopes, lock the contract with a complete code × presence matrix driven through the real executor plus injected fakes: assert the identifier's exact value on DELEGATE_FAILED and DELEGATE_CANCELLED where the fake client's session.create returned a fixed id ("child-session"), and assert omission (toBeUndefined) on both codes where no child session was ever created (cancelled-before-child and child_create_failed). Both directions are needed because the field is conditionally present by design — presence assertions catch dropped threading, omission assertions catch erroneous always-include regressions. The fake-client pattern (session.create/message/prompt/abort recording fakes, hangPrompt:true for timeout propagation) composes with the real executeAgentSession so the threading is verified end-to-end rather than against a stubbed result.
