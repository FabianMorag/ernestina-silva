# Manual knockout placement
Branch: `feat/tournament-admin`. Delivery: `exception-ok` (the user previously waived line-count limits). Runners: API Vitest; web Node tests, oxlint and Vite build. Forecast: ~350 authored lines for this feature, excluding existing uncommitted admin UX.

## Specs
- S1 — "ok, si tenemos que fijar eso primero, tienes razon" and "si, me parece bien": record knockout round and pairing position explicitly before a public bracket is built. Assumption: use round size (2, 4, 8, 16, 32, 64) and slot within that round, with no automatic creation of later matches.
- S2 — "las rondas y los cruces se definan explícitamente desde administración": allow an administrator to place and correct a knockout match in a round/slot; preserve existing matches without placement.
- S3 — "sin generar automáticamente la siguiente ronda": save only the match being edited; never create another match as a side effect.
- S4 — "recuerda que el backend siempre se cae cuando re haces el build": do not run the API production build while the Nest watcher is running.

## Tasks
- T1 (S1, S3): inline; complete; nullable migration, validation and API tests; commit `d333414`. Risk: item 1, persisted format change; independently verified.
- T2 (S2, S3): inline; verified; admin placement controls and focused checks; commit pending. Risk: none.
- T3 (S4): inline; complete; migration/data preservation and web checks verified without an API production build. Risk: none.

## Log
- L1 (2026-10-21): "si, me parece bien"
- L2 (2026-10-21): "ok, si tenemos que fijar eso primero, tienes razon"
- L3: Existing Match has nullable stage/group links but no knockout round or slot. Existing recorded matches must remain intact and unplaced until assigned. The public detail (standings, bracket, history and motion) follows after the placement model is verified.
- L4: T1 RED: five focused failures before implementation; migration regression RED on partial null placement. GREEN: 52 focused API tests, Prisma validate, typecheck, isolated PostgreSQL verifier and corrected null CHECK recheck. Local additive migration applied and Prisma client regenerated. Full API suite: 56 passed, one pre-existing seed test fails because user's uncommitted names differ from test expectations. No API build run.
- L5: T2 RED: web helper and match-form tests failed before implementation. GREEN: 15 web tests, format check, lint, Vite build and diff check passed. Admin creation and editing can set explicit round/slot, existing unplaced matches remain valid, occupied slots are disabled client-side and rejected server-side. Earlier approved championship admin routes and match-form layout are included in the same UI commit because they share the uncommitted AdminPage changes. T3 preserved the running backend; no API production build was run.
