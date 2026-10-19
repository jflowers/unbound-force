---
tag: dependency-management
author: jay-flowers
category: gotcha
created_at: 2026-10-19T18:23:52Z
identity: dependency-management-20261019T182352-jay-flowers
tier: draft
---

Circular engine-floor verification: when a transitive dependency's Node engines range is disjunctive (ini 7.0.0 declares "^22.22.2 || ^24.15.0 || >=26.0.0"), a single-value manifest floor cannot express it. Declaring the loosest value the local runtime satisfies and then "verifying" against that self-authored range is circular — e.g. Node v24.11.1 fails ini 7's >=24.15.0 requirement while passing a ">=22.22.2" floor, and npm's advisory engines enforcement catches neither. Recipe: derive the engines floor from the binding transitive range, and verify the local runtime against the transitive's declared range, never against the manifest's own field.
