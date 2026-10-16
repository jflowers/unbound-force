---
tag: uf-workflow-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-16T15:26:56Z
identity: uf-workflow-testing-20261016T152656-jay-flowers
tier: draft
---

Shared line-grammar regexes with `$` anchors reject CRLF lines: in JavaScript, `.` excludes `\r` and `$` without the `m` flag matches only at end-of-input, so a line ending in `\r` can never satisfy the pattern. When multiple consumers share one line matcher, normalize line endings at a single point — inside the shared matcher, or identically at every consumer — because per-consumer `\r`-stripping drifts. Concrete instance (unbound-force uf-workflow plugin): parseTasksText and countUncheckedCheckboxes stripped a trailing `\r` before calling matchTaskLine, but findTaskLine did not, so mark_task_complete returned TASK_NOT_FOUND on CRLF tasks.md files that parse_tasks and detect_resume accepted — violating the documented "the two tools cannot disagree about what counts as a task" invariant. Test-design corollary: a CRLF fixture exercised through one consumer's test does not pin the contract for the others. Route every CRLF fixture through all consumers of the shared grammar (parse, count, mark), and when the consumer computes byte offsets over raw text (findTaskLine's lineStart), keep offset arithmetic on the RAW line length while matching against the normalized line so flip offsets stay byte-correct. (Round-2 council, run 6f909849, artifact 8601976b; HIGH finding fixed in iteration 2.)
