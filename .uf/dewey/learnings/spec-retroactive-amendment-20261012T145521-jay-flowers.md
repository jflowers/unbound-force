---
tag: spec-retroactive-amendment
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:55:21Z
identity: spec-retroactive-amendment-20261012T145521-jay-flowers
tier: draft
---

When modifying completed, ratified specs (specs/018-*, specs/031-*) to match a code change, this inverts the spec-driven development model. The correct approach is: (1) create a new spec or OpenSpec change that justifies the behavioral change, (2) implement the change per the new spec, (3) leave the original specs as point-in-time design records. Retroactively editing ratified specs to match code changes erodes the spec's value as a planning record and makes it impossible to trace when and why requirements changed.
