# Player statistics
Objective: Replace the public match-history view with player statistics grouped by championship type, backed by an explicit stored type.
Branch: `feat/player-statistics` · Delivery: `ask-on-risk` · Runners: API Vitest/e2e, web Node tests, build/lint. Forecast: ~400 authored lines.

## Specs
- S1: “me gustaría reemplazar la pagina de historial de partidos por una pagina de estadisticas.” Replace the public history view with statistics; preserve a usable legacy `/partidos` entry point. Check public navigation and routing.
- S2: “tablas globales de partidos jugados, ganados, empatados, perdidos, puntos, goles a favor, goles en contra, disferencia de goles, y rendimiento porcentual. eso para cada jugador” Show per-player totals from recorded matches with those metrics. Check aggregate tests.
- S3: “podriamos separarlo para cada tipo de campeonato, normalmente tenemos dos campeonatos diferentes cada año. Entonces serían 3 tablas, "copa america" "mundial" y "general"” Aggregate across years into Copa América, Mundial and General. Check category filtering and general totals.
- S4: “si, deberiamos añadir campos para el tipo de campeonato, para diferenciarlos” Persist an explicit championship type and collect it for new championships; classify existing Copa América 2024 and Mundial 2024 records without discarding data. Check migration and admin API/form.
- S5: “si, estoy de acuerdo con todos esos calculos” Use existing 3/1/0 points and performance = points / (3 × played) × 100. Check wins/draws/losses and zero-match handling.

## Tasks
- T1 [S3-S4] inline — complete — Added type schema/backfill, admin creation validation/UI and contract tests. Risk: item 1 (migration) and item 3 (required create contract). Commit: recorded in L6.
- T2 [S1-S3,S5] inline — pending — Build statistics calculation/view, update public navigation/routing and tests. Risk: item 3 (public route compatibility). Commit: pending.

## Log
- L1 (2026-10-26): “me gutstaría reemplazar la pagina de historial de partidos por una pagina de estadisticas. Me gustaría ver tablas globales de partidos jugados, ganados, empatados, perdidos, puntos, goles a favor, goles en contra, disferencia de goles, y rendimiento porcentual. eso para cada jugador, podriamos separarlo para cada tipo de campeonato, normalmente tenemos dos campeonatos diferentes cada año. Entonces serían 3 tablas, "copa america" "mundial" y "general", me expico?”
- L2 (2026-10-26): “si, deberiamos añadir campos para el tipo de campeonato, para diferenciarlos”
- L3 (2026-10-26): “si, estoy de acuerdo con todos esos calculos”
- L4 (2026-10-26): Existing standings use 3/1/0. Local data has Copa América 2024 and Mundial 2024. Assumption: `/partidos` remains a redirect to the new statistics route rather than disappearing. No production database mutation is authorized in this feature.
- L5 (2026-10-26): T1 RED: controller expected persisted type and rejected invalid type; migration test failed before SQL existed. GREEN: API 66/66; web 49/49; API/web lint and builds; local migration applied after a local backup, and both local championship rows retain names with assigned types. Independent verifier passed realistic HTTP/SQL probes with unchanged hashes after rejected operations. Fixed its advisory by preserving valid type in the existing invalid-stageKinds test.
