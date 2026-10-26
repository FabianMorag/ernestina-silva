# Player statistics
Objective: Replace the public match-history view with player statistics grouped by championship type, backed by an explicit stored type.
Branch: `feat/player-statistics` · Delivery: `exception-ok` (user waived line limit) · Runners: API Vitest/e2e, web Node tests, build/lint. Forecast: ~400 authored lines.

## Specs
- S1: “me gustaría reemplazar la pagina de historial de partidos por una pagina de estadisticas.” Replace the public history view with statistics; preserve a usable legacy `/partidos` entry point. Check public navigation and routing.
- S2: “tablas globales de partidos jugados, ganados, empatados, perdidos, puntos, goles a favor, goles en contra, disferencia de goles, y rendimiento porcentual. eso para cada jugador” Show per-player totals from recorded matches with those metrics. Check aggregate tests.
- S3: “podriamos separarlo para cada tipo de campeonato, normalmente tenemos dos campeonatos diferentes cada año. Entonces serían 3 tablas, "copa america" "mundial" y "general"” Aggregate across years into Copa América, Mundial and General. Check category filtering and general totals.
- S4: “si, deberiamos añadir campos para el tipo de campeonato, para diferenciarlos” Persist an explicit championship type and collect it for new championships; classify existing Copa América 2024 and Mundial 2024 records without discarding data. Check migration and admin API/form.
- S5: “si, estoy de acuerdo con todos esos calculos” Use existing 3/1/0 points and performance = points / (3 × played) × 100. Check wins/draws/losses and zero-match handling.

## Tasks
- T1 [S3-S4] inline — complete — Added type schema/backfill, admin creation validation/UI and contract tests. Risk: item 1 (migration) and item 3 (required create contract). Commit: recorded in L6.
- T2 [S1-S3,S5] inline — complete — Built statistics calculation/view, updated public navigation/routing and tests. Risk: item 3 (public route compatibility). Commit: `9e163c8`.

## Log
- L1 (2026-10-26): “me gutstaría reemplazar la pagina de historial de partidos por una pagina de estadisticas. Me gustaría ver tablas globales de partidos jugados, ganados, empatados, perdidos, puntos, goles a favor, goles en contra, disferencia de goles, y rendimiento porcentual. eso para cada jugador, podriamos separarlo para cada tipo de campeonato, normalmente tenemos dos campeonatos diferentes cada año. Entonces serían 3 tablas, "copa america" "mundial" y "general", me expico?”
- L2 (2026-10-26): “si, deberiamos añadir campos para el tipo de campeonato, para diferenciarlos”
- L3 (2026-10-26): “si, estoy de acuerdo con todos esos calculos”
- L4 (2026-10-26): Existing standings use 3/1/0. Local data has Copa América 2024 and Mundial 2024. Assumption: `/partidos` remains a redirect to the new statistics route rather than disappearing. No production database mutation is authorized in this feature.
- L5 (2026-10-26): T1 RED: controller expected persisted type and rejected invalid type; migration test failed before SQL existed. GREEN: API 66/66; web 49/49; API/web lint and builds; local migration applied after a local backup, and both local championship rows retain names with assigned types. Independent verifier passed realistic HTTP/SQL probes with unchanged hashes after rejected operations. Fixed its advisory by preserving valid type in the existing invalid-stageKinds test.
- L6 (2026-10-26): T1 commit `265141c` (`feat: add championship type to persisted tournaments`). Native RDD is disabled globally; no native review was started.
- L7 (2026-10-26): T2 RED: new aggregate and route tests failed before implementation; zero-game player test then failed until player catalog was included. GREEN: 52/52 web tests, oxlint, Prettier check, build, and diff check. Independent verifier passed route redirect, three-table SSR, aggregate cases and baseline route/count invariants. Local web and API endpoints return HTTP 200 after restarting Nest watch (an API build had displaced its dist output). T2 has no commit yet: accumulated authored changes exceed the review budget, and `ask-on-risk` requires the user's chain-strategy choice before the next commit.
- L8 (2026-10-26): “haz los commits semanticos, ignora limite de lieas”. User waived the line-count gate; keep behavior/tests/docs together in conventional commits without creating a PR or pushing.
- L9 (2026-10-26): T2 committed as `9e163c8` (`feat(public): add cumulative player statistics`). Earlier uncommitted public-heading work was committed separately as `fd6cf26` (`style(public): simplify home and championship headings`). Pre-existing package.json and pnpm-lock.yaml changes remain unstaged and uncommitted. No remote push or production migration was performed.
