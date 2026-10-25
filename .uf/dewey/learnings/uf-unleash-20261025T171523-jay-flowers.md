---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-25T17:15:23Z
identity: uf-unleash-20261025T171523-jay-flowers
tier: draft
---

A bounded retry loop's mid-loop counter can only live in a checkpoint step whose resume-detection semantics are safe for partial state. In /uf.unleash's build/test fix loop (PR 815 iteration 3 review), loop step 4 directed the quick gate to persist its fixLoopQuick counter "in the calling gate's durable checkpoint data" after every delegated attempt — but the quick gate's only checkpoint step (quick-pre-flight) is a completion claim that uf_unleash_detect_resume pairs with the implement claim (auto-recorded by the preceding whole-change delegation) to mark implement done. Recording it mid-loop makes a resumed session skip the still-failing blocking gate (the exact bypass the quick-pre-flight claim was created to prevent, cf. learning unleash-pipeline-20261020T125036); deferring it to the gate's on-success rule leaves the budget undurable (fresh 3 attempts per resume, violating the spec's cross-session MUST). The phase checkpoint is safe for mid-loop counters because it is verdict-bearing (detect_resume re-enters on a "failed" verdict), and Step 6's code-review-preflight step is safe because it is resume-inert (code-review completion derives from dispatch artifacts). Rule: before wiring loop state into a gate's checkpoint, classify the checkpoint step by its resume-detection role — completion claim, verdict-bearing, or inert — and give completion-claim gates a dedicated inert or verdict-bearing step for mid-loop state (e.g. a budget-only step name detect_resume ignores), or extend detect_resume to read a verdict/counter from the claim's data before trusting it. A durability claim's store enumeration must verify not just that each gate has a data key, but that the key's recording trigger and step semantics survive a mid-loop crash.
