# Manual knockout placement
Branch: `feat/tournament-admin`. Delivery: `ask-on-risk`. Runners: API Vitest; web Node tests, oxlint and Vite build. Forecast: ~350 authored lines.

## Specs
- S1 — "ok, si tenemos que fijar eso primero, tienes razon" and "si, me parece bien": record knockout round and pairing position explicitly before a public bracket is built. Assumption: use round size (2, 4, 8, 16, 32, 64) and slot within that round, with no automatic creation of later matches.
- S2 — "las rondas y los cruces se definan explícitamente desde administración": allow an administrator to place and correct a knockout match in a round/slot; preserve existing matches without placement.
- S3 — "sin generar automáticamente la siguiente ronda": save only the match being edited; never create another match as a side effect.
- S4 — "recuerda que el backend siempre se cae cuando re haces el build": do not run the API production build while the Nest watcher is running.

## Tasks
- T1 (S1, S3): inline; pending; nullable migration, validation and API tests; commit pending. Risk: item 1, persisted format change.
- T2 (S2, S3): inline; pending; admin placement controls and focused checks; commit pending. Risk: none unless shared API contract changes unexpectedly.
- T3 (S4): inline; pending; verify migration/data preservation, web checks and user-facing handoff; no commit unless needed.

## Log
- L1 (2026-10-21): "si, me parece bien"
- L2 (2026-10-21): "ok, si tenemos que fijar eso primero, tienes razon"
- L3: Existing Match has nullable stage/group links but no knockout round or slot. Existing recorded matches must remain intact and unplaced until assigned. The public detail (standings, bracket, history and motion) follows after the placement model is verified.
