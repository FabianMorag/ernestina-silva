# Player roster and championship assignments
Objective: seed the named roster, edit player names/titles in admin, and assign one team per player per championship.
Branch: feat/tournament-admin. Delivery: exception-ok (user explicitly ignores line counts). Runner: pnpm.

## Specs
- S1: Seed players named exactly "carrasco, anito, borito, mufasa, nico, rodrigo, pipe, topo, colocho, alvaro, diego, vitoko". Optional titles: Carrasco "el campeon de la verguenza", borito "humilde y alegre", anito "el campeon más lloron", mufasa "the fundamentals", rodrigo "la eterna promesa". Others have no title. Seed must be rerunnable without reverting admin edits.
- S2: "La idea es poder modificar estos nombres y titulos en la interfaz de admin". Admin can edit player name and optional title; public reads remain unauthenticated.
- S3: "voy a tomar tu sugerencia de asignar un equipo y un jugador para un campeonato completo". A player has one assigned team in each championship; a later championship may assign another team. New matches must use the assignment.
- S4: "es necesario mantener engram en el registro de cambios? quizas podriamos quitarlo". Explain the repository configuration's role; do not rewrite commit history or remove it without explicit confirmation.
- S5: Team seed remains pending because no team names were supplied. Do not invent teams.

## Tasks
- T1 (S1): inline; complete; additive Player.title migration and idempotent roster seed; commit cd1a635.
- T2 (S2): inline; complete; player edit API and admin form; commit 927786f.
- T3 (S3): inline; complete; assignment model, API, match validation, admin form; commits cd1a635 and 927786f.
- T4 (S4-S5): inline; complete; docs, checks, independent high-risk verification, explanation; commit 927786f. Team seed remains pending names, outside authorized data.

## Log
- L1 (2026-10-20), user's original request verbatim:

  > -es necesario mantener engram en el registro de cambios? quizas podriamos quitarlo
  > -los jugadores son carrasco, anito, borito, mufasa, nico, rodrigo, pipe, topo, colocho, alvaro, diego, vitoko. Estoy pensando en añadir un titulo a cada jugador, pero no requerido, porque algunos no tienen. Carrasco es "el campeon de la verguenza", borito es "humilde y alegre", anito es "el campeon más lloron", mufasa es "the fundamentals", rodrigo es la eterna promesa. La idea es poder modificar estos nombres y titulos en la interfaz de admin
  > -voy a tomar tu sugerencia de asignar un equipo y un jugador para un campeonato completo

- L2: Existing local PostgreSQL Player, Team, Championship, and Match tables each contain zero rows. Current match schema stores team IDs per match, with no assignment table. `.engram/config.json` is tracked and supplies the canonical project identity. No team names have been supplied.
- L3: T1 implemented in cd1a635. Local migration applied and player seed executed twice; Player count remains 12. Prisma v7 explicit seed command is configured.
- L4: T2-T4 implementation and README in 927786f. API tests 17/17, web tests 5/5, e2e 6/6 with RUN_DB_RACE_TEST=1 against a throwaway PostgreSQL database, builds and lint pass. Independent verifier reproduced then rechecked a real assignment/match race; Serializable transactions now return 409 for the losing request without inconsistent persistence. Standard e2e skips the opt-in database race test. Engram config remains tracked because it identifies the project; no history rewrite. Team seed awaits names. RDD is globally off, so native review was not invoked.
