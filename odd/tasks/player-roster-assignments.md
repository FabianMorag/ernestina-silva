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
- T1 (S1): inline; pending; additive Player.title migration and idempotent roster seed; commit pending.
- T2 (S2): inline; pending; player edit API and admin form; commit pending.
- T3 (S3): inline; pending; assignment model, API, match validation, admin form; commit pending.
- T4 (S4-S5): inline; pending; docs, checks, independent high-risk verification, explanation; commit pending.

## Log
- L1 (2026-10-20): "-es necesario mantener engram en el registro de cambios? quizas podriamos quitarlo\n-los jugadores son carrasco, anito, borito, mufasa, nico, rodrigo, pipe, topo, colocho, alvaro, diego, vitoko. Estoy pensando en añadir un titulo a cada jugador, pero no requerido, porque algunos no tienen. Carrasco es \"el campeon de la verguenza\", borito es \"humilde y alegre\", anito es \"el campeon más lloron\", mufasa es \"the fundamentals\", rodrigo es la eterna promesa. La idea es poder modificar estos nombres y titulos en la interfaz de admin\n-voy a tomar tu sugerencia de asignar un equipo y un jugador para un campeonato completo"
- L2: Existing local PostgreSQL Player, Team, Championship, and Match tables each contain zero rows. Current match schema stores team IDs per match, with no assignment table. `.engram/config.json` is tracked and supplies the canonical project identity. No team names have been supplied.
