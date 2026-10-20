# Fixed championship stages
Objective: Select fixed stage types when creating a championship and remove custom stage names.
Branch: `feat/tournament-admin` · Delivery: ask-on-risk · Runner: pnpm API Vitest/TypeScript/lint, web Node tests/lint/build; Prisma validate/migration checks. Forecast: ~350 authored changed lines.

## Specs

S1. User: "estoy pensando que los campeonatos tengan las mismas 3 etapas que definimos (grupos/liga/eliminacion directa) pero sin nombre de cada etapa, no es necesario, simplemente al crear un campeonato tengamos unos checkbox multiples (1 al menos seleccionado) con las 3 opciones". Acceptance: championship creation offers the three types as multiple checkboxes, requires at least one, and creates the selected stages with the championship in one operation. Check API validation and UI build.
S2. User: "podemos eliminar el nombre de cada etapa simplemente, da lo mismo si es para nuevos o ya creados, esto es desarrollo por ahora, no se si me explico". Acceptance: stage names are removed from the model and admin/public display; existing stage-linked matches retain a valid stage type after migration. Check migration SQL and match reads.
Assumption: each championship has at most one stage per type; duplicate existing stages of one type are merged by preserving one stage ID and reassigning matches.

## Tasks

- T1 · S1-S2 · inline (one coupled schema/API/UI behavior; no parallel writer reason) · complete · commit `3e3f3ad` · Risk: items 1 and 3 (stored stage data and API contract).

## Log

- L1 2026-10-20: User request: "estoy pensando que los campeonatos tengan las mismas 3 etapas que definimos (grupos/liga/eliminacion directa) pero sin nombre de cada etapa, no es necesario, simplemente al crear un campeonato tengamos unos checkbox multiples (1 al menos seleccionado) con las 3 opciones"
- L2 2026-10-20: User clarification: "podemos eliminar el nombre de cada etapa simplemente, da lo mismo si es para nuevos o ya creados, esto es desarrollo por ahora, no se si me explico"
- L3 2026-10-20: Existing Stage has required name and kind, uniqueness by championship+name; matches reference stage IDs. Use a preserving SQL merge before changing uniqueness and dropping name. RDD is globally off.
- L4 2026-10-20: RED: championship-creation tests failed before implementation (2 failures); null-stage-body regression test failed with TypeError before guard. GREEN: focused API 28/28, full API 36/36, web 12/12; API/web builds, Prisma validate, API/web lint, web format, and git diff check passed. Independent verifier passed S1-S2 and isolated PostgreSQL migration probe with duplicate stages and five matches; browser interaction was not exercised. README updated. Work-unit commit `3e3f3ad`; RDD disabled, so no native assess or review.
