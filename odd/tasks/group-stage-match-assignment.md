# Group-stage match assignment
Objective: Define groups within a championship's group stage and assign matches to them.
Branch: `feat/tournament-admin`; delivery: ask-on-risk; runner: pnpm/Vitest and Node tests; forecast: ~350 authored lines.

## Specs
- S1: "Creo que algo que nos falta añadir es, si tenemos una fase de grupos, definir a que grupo pertenece el partido, cierto?" — Admins can define named groups for a GROUP stage; names are unique within that stage.
- S2: The accepted proposal was to associate each group-stage match with one group. New GROUP-stage matches require one; edits can assign or change it; API rejects a group from another stage or championship.
- S3: Assumption stated before implementation: existing matches must not be assigned to a guessed group by migration; they may remain unassigned until edited.
- S4: A match's assigned group is visible in admin and public match lists.

## Tasks
- T1 [S1-S4] inline, complete, commit `d1c8cf9` — schema, API, web, tests, docs; Risk: items 1 and 3 (migration and existing match contract).

## Log
- L1 (2026-10-21): "Creo que algo que nos falta añadir es, si tenemos una fase de grupos, definir a que grupo pertenece el partido, cierto?"
- L2 (2026-10-21): "vale, vamos con eso"
- L3 (2026-10-21): Accepted proposal: "modelar cada grupo dentro de la fase y asociar el partido a uno". Existing matches must not be guessed into groups. `apps/api/prisma/seed.ts` was already modified by the user and is outside this task.
- L4 (2026-10-21): RED: API focused tests failed for missing group behavior; match form reset test failed for missing group preservation. GREEN: API focused 40/40, web 13/13, API e2e 5 passed/1 skipped, lint and builds passed. Independent verifier passed S1-S4 and isolated migration preservation probes; 6 local matches remained after migration, all with `groupId` null. Full API suite has one unrelated pre-existing seed-name expectation failure caused by the user's `apps/api/prisma/seed.ts` change. Native RDD was off by explicit global preference.
- L5 (2026-10-21): Feature work unit committed as `d1c8cf9` (350 additions, 18 deletions). No push or PR.
