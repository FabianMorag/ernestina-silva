# Admin sections and championship rosters
Objective: split the existing admin surface into focused pages while preserving championship-specific participants and teams.
Branch: feat/tournament-admin. Delivery: exception-ok (user requested no line-count constraint). Runner: pnpm.

## Specs
- S1: "pagina para administrar jugadores" — player creation and name/optional-title editing live on their own admin page.
- S2: "otra para administrar los equipos" — team creation and catalog live on their own admin page.
- S3: "otra para crear los campeonatos y \"cargarlos\" con los jugadores y equipos, porque notodos los jugadores y equipos participan en todos los campeonatos." — championship creation and per-championship participant/team assignment live together; only assigned entries appear in that championship's roster and match choices.
- S4 (existing behavior to preserve): match entry/history and optional stages remain available, and all public routes and admin authentication retain their prior behavior. Assumption: match entry gets its own admin page; stages stay with championships.

## Tasks
- T1 (S1-S4): inline; verified; separate admin navigation/pages and scoped roster workflow with tests and docs; work-unit commit pending.

## Log
- L1 (2026-10-20), user's original request verbatim:

  > en la parte de admin me parece que deberíamos hacer una separación, por ejemplo, pagina para administrar jugadores, otra para administrar los equipos, otra para crear los campeonatos y "cargarlos" con los jugadores y equipos, porque notodos los jugadores y equipos participan en todos los campeonatos.

- L2: Existing ChampionshipParticipant uniquely links championship and player to a team. The backend already rejects matches that do not use those assignments. Current App.tsx renders every admin form on /admin, with no section navigation. No backend/schema change is required for the requested separation.
- L3: Added direct admin URLs for Jugadores, Equipos, Campeonatos, and Partidos. Championship rosters filter participants and team assignments; match options use the same filtered roster. Native links preserve public routing. RED: web test failed because admin-navigation.ts did not exist. GREEN: web tests 7/7, build and lint passed. Independent verifier found no blocker, exercised mocked browser admin flows at 390px and 1280px, and API unit tests 17/17. Actual database transaction behavior was not retested because API logic was unchanged. Standard API production build was intentionally skipped while the live Nest watcher shares dist. RDD is globally off.
