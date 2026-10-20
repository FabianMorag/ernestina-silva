# Player list style and team seed
Objective: restyle the admin player list to match the sketch and seed the supplied team catalog.
Branch: feat/tournament-admin. Delivery: exception-ok (user ignores line counts). Runner: pnpm.

## Specs
- S1: "la lista de jugadores la imagino más de este estilo, menos ai-slop, lineas suaves, parecido a algunas listas de daisyui" plus the attached sketch: one list titled "Lista de jugadores", an "Añadir jugador +" action at the top right, and rows showing the player name, optional title, and a pencil edit action. Correction (L4): "deja de hacer ai-slop, no metas la lista en una caja, haz una separación simple entre los nombres de cada jugador": no outer box or card around the list, and one soft separator between rows supplied by the daisyUI list rows without extra borders. No avatars, badges, per-row cards, or heavy shadows.
- S2: Existing player creation and name/optional-title editing stay available, including accessible names for both inputs.
- S3: "la lista de equipos es bayern munich, manchester city, inter de milan, arsenal, real madrid, psg, barcelona, liverpool, atletico madrid, españa, belgica, inglaterra, brasil, alemania, italia, holanda, portugal, francia, argentina" seeded with corrected spelling: Bayern Munich, Manchester City, Inter de Milán, Arsenal, Real Madrid, PSG, Barcelona, Liverpool, Atlético Madrid, España, Bélgica, Inglaterra, Brasil, Alemania, Italia, Holanda, Portugal, Francia, Argentina. Rerunnable without reverting admin edits, matching the player seed.
- S4 (superseded by L8, edit-only): "haz además falta añadir el boton de borrar" was answered with edit-only. No delete button or DELETE endpoint; players are edited, never removed.
- S5: "el titulo está duplicado, deja un solo titulo" and "si el jugador no tiene titulo, que no aparezca nada en lugar de decir "sin titulo". mejor dejar vacio eso": one page title only ("Jugadores"), and a player without a title shows no subtitle at all.
- S6: "ejecuta tu mismo la carga de los equipos": the parent runs the team seed against the local database and checks the counts (19 teams, 12 players). Assumption: a second run changes nothing.
- S7: "capitaliza los nombres y titulos": capitalize the seeded player names; normalize titles to sentence case and correct their accents, as selected by the user.
- S8: "añadimos las skills al gitignore?": ignore `.agents/` and `.claude/`; keep `skills-lock.json` trackable.
- S9: "ejecuta el prettier para ordenar el codigo y las clases de tailwind, se puede?": configure Prettier and its Tailwind class-sorting plugin for `apps/web`, then format web source files.

## Tasks
- T1 (S1-S2, S5): inline; complete (L10, reopened by L9); one title and no empty-title placeholder; uncommitted.
- T2 (S3): inline; complete; idempotent team seed, test, and README; uncommitted.
- T3 (S4): dropped by L8; no DELETE endpoint.
- T4 (S4): dropped by L8; no web helper or delete button.
- T5 (S6): inline; complete (L10); seed ran twice on the local database: 19 teams, 12 players, names checked.
- T6 (S7): inline; complete (L11); seed titles corrected; local seed records normalized only when matching old values; uncommitted.
- T7 (S8): inline; complete (L11); `.agents/` and `.claude/` ignored; `skills-lock.json` remains trackable; uncommitted.
- T8 (S9): inline; complete (L11); Prettier and Tailwind plugin configured; `apps/web/src` formatted; verification passed; uncommitted.

## Log
- L1 (2026-10-20), user's original request verbatim:

  > /tmp/gpFmn6Ov/pi-clipboard-d99846d4-f91e-4573-bb24-29c4a3e0de2e.png la lista de jugadores la imagino más de este estilo, menos ai-slop, lineas suaves, parecido a algunas listas de daisyui
  >
  > -la lista de equipos es bayern munich, manchester city, inter de milan, arsenal, real madrid, psg, barcelona, liverpool, atletico madrid, españa, belgica, inglaterra, brasil, alemania, italia, holanda, portugal, francia, argentina  (tu te preocupas de escribirlos correctamente)
- L2 (2026-10-20): T1 replaced the card list with one bordered daisyUI list: header, add dropdown, name/title columns, and a lucide Pencil button opening the existing PATCH form. Trash action omitted; no delete endpoint existed. Accessible input names kept.
- L3 (2026-10-20): T2 seeds 19 teams with corrected spelling and fixed IDs; upsert update is empty, so reruns never revert admin edits. Seed spec 2/2, web tests 7/7, web lint passed. Not committed; local database not reseeded.
- L4 (2026-10-20), user's correction verbatim:

  > /tmp/gpFmn6Ov/pi-clipboard-8c54d172-1f64-4293-bb55-f0291cf8b41a.png deja de hacer ai-slop, no metas la lista en una caja, haz una separación simple entre los nombres de cada jugador, haz además falta añadir el boton de borrar

  Reopens T1 and adds T3-T4. Evidence: the screenshot shows an outer box and doubled row borders, because daisyUI list rows already draw separators and the markup added border-t on top of them.
- L5: Delete rule chosen as the non-destructive default, pending your confirmation: a player with matches or championship assignments is refused with 409 and stays listed; unused players are deleted. Database foreign keys already use ON DELETE RESTRICT; the explicit check makes the rule visible. Not implemented: removing unused roster assignments first.
- L6 (2026-10-20), user's question verbatim: "pero que deberiamos hacer en esos casos? porque la idea tampoco es eliminar un jugador y que se pierdan todos sus registros, deberiamos desactivarlo solamente, no? o quizas está bien no borrarlo"
  Answer offered: with the planned guard no records are lost (409 check plus RESTRICT foreign keys), but the real need is retiring a player from new matches and rosters, which means deactivating. A hard-deleted seeded player without history would return on a seed rerun (fixed IDs, upsert create). Options offered: deactivate (recommended, additive active column), edit-only, delete-unused. Decision pending: T3 and T4 wait for it; T1 continues because it does not depend on it.
- L7 (2026-10-20): T1 done. The players section has no outer box, no column header, and no extra row borders; daisyUI list rows supply the separators. Edit stays a pencil dropdown on the existing PATCH form. Web tests 7/7, lint and build passed. Not checked in a browser. The delete button is not in this change (T3/T4, blocked by L6).
- L8 (2026-10-20), user's answer to the L6 question: "Solo editar, sin borrar" (edit-only). T3 and T4 dropped, S4 superseded; players stay editable only, with no delete and no migration. Feature closed: T1 and T2 complete, changes uncommitted.
- L9 (2026-10-20), user's corrections verbatim: "el titulo está duplicado, deja un solo titulo"; "si el jugador no tiene titulo, que no aparezca nada en lugar de decir "sin titulo". mejor dejar vacio eso"; "ejecuta tu mismo la carga de los equipos". Reopens T1 (S5); adds T5 (S6). Decision: the page title "Jugadores" stays and the inner "Lista de jugadores" heading goes, since the page title already names the list.
- L10 (2026-10-20): T1 and T5 done. The players page keeps one title, "Jugadores"; the inner heading is gone and the add button sits alone at the right. A player without a title shows no subtitle. Web tests 7/7, lint and build passed; not checked in a browser. Team seed ran twice on the local database: 19 teams with the corrected names, 12 players, no duplicates on rerun. Temporary count script removed. Not committed.
- L11 (2026-10-20), user's follow-up verbatim:

  > -capitaliza los nombres y titulos
  >  -añadimos las skills al gitignore?
  >  -ejecuta el prettier para ordenar el codigo y las clases de tailwind, se puede?
  >
  > continua con esto

  Decisions selected: sentence case with accent correction for titles; ignore `.agents/` and `.claude/` but keep `skills-lock.json` trackable; configure Prettier and Tailwind class sorting for `apps/web` only. Seed and local database names/titles capitalized. Local rows updated only when current fields matched the old seed values exactly; after inspecting all 12 seeded players, the conditional update changed 12 names and 5 titles. `apps/web` format, format-check, tests (7/7), lint, build and API seed spec (2/2) passed. Dependency installation and formatting changes are uncommitted.
