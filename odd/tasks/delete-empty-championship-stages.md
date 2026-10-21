# Delete championship stages while retaining matches
Objective: Let admins remove a mistakenly added championship stage while retaining its matches without stage or group assignment.
Branch: `feat/tournament-admin`; delivery: ask-on-risk; runner: pnpm/Vitest and Node tests; forecast: ~160 authored lines.

## Specs
- S1: "me gustaría eliminar etapas fases del campeonato, porque añadí una por error" — Admins can delete a selected stage from its championship.
- S2: "es que la fase que tiene asociada cada partido podría ser null, no? asi evitariamos borrar partidos" and "si, no? yo creo que esa sería una buena idea" — When a stage is deleted, linked matches remain with their stage and group set to null. Unrelated matches and their associations remain unchanged.
- S3: Groups belonging to the deleted stage are removed. Confirmation explains that matches retain results but lose stage/group assignment.
- S4: The operation is atomic: a rejected or failed delete leaves match data unchanged, including under concurrent match creation.

## Tasks
- T1 [S1-S4] inline, complete, commit pending — API transactional detachment and delete, admin control, tests and documentation; Risk: items 1 and 4 (stored-data changes and race with match creation).

## Log
- L1 (2026-10-21): "me gustaría eliminar etapas fases del campeonato, porque añadí una por error"
- L2 (2026-10-21): Local database has three empty stages in Copa América 2024 (GROUP has two groups; LEAGUE/KNOCKOUT have none) and one KNOCKOUT stage with six matches in Mundial 2024. Do not delete any stage on the user's behalf. Preserve the pre-existing user edit in apps/api/prisma/seed.ts. RDD is globally off; avoid API build while Nest watch is running.
- L3 (2026-10-21): PostgreSQL currently has ON DELETE SET NULL on both Match.stageId and Match.groupId, so a deletion guard alone would not prevent race-driven unassignment. Change both to RESTRICT before enabling stage deletion. This migration changes constraints only, not match values.
- L4 (2026-10-21): User correction, verbatim: "es que la fase que tiene asociada cada partido podría ser null, no? asi evitariamos borrar partidos"
- L5 (2026-10-21): User confirmation, verbatim: "si, no? yo creo que esa sería una buena idea". Replace the initial block-on-matches policy with an atomic detach-and-delete; preserve the RESTRICT migration as a concurrency guard.
- L6 (2026-10-21): RED: three controller tests failed under old block-on-matches behavior; GREEN: focused controller 40/40, API typecheck, web build, web tests 13/13, API e2e 5 passed/1 skipped, lint. API full suite: 48 pass/1 unrelated seed-name expectation failure from pre-existing user edit. Independent verifier passed S1-S4 with isolated Prisma/PGlite HTTP, rollback, and simulated late-reference probes; parent reran its probe successfully. No API production build while watcher ran. Local migration applied; six matches preserved. Stage count later changed from four to three (Copa América LEAGUE disappeared) without a deletion command from this implementation or verifier; actor unverified.
