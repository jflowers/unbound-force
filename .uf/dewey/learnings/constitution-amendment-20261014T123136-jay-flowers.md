---
tag: constitution-amendment
author: jay-flowers
category: gotcha
created_at: 2026-10-14T12:31:36Z
identity: constitution-amendment-20261014T123136-jay-flowers
tier: draft
---

Constitution amendments that add a principle must sweep the constitution body AND README for hard-coded principle counts and enumerations before finalizing the task list — the SYNC IMPACT REPORT update covers only the comment block. In unbound-force/unbound-force: the constitution's Hero Constitution Alignment says hero constitutions 'MAY add principles beyond the five org principles' (stale the moment Principle VI lands), and README.md's Constitution section (line 15) still enumerates four principles and says 'four org principles' at line 62 while the live constitution already has five (I-V). Adding a principle without reconciling these references compounds silent drift in governance documents. Verification recipe: grep the constitution and README for ordinal count words ('four', 'five', 'six') and re-enumerate every principle list in the same change that adds the principle.
