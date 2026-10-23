# Ernestina Silva

React/Vite frontend and NestJS/Fastify API in one pnpm workspace. Local PostgreSQL runs through Docker Compose; Prisma owns the API database connection.

## Local development

From the repository root, install dependencies and start the local database:

```sh
pnpm install
pnpm db:up
cp apps/api/.env.example apps/api/.env
```

Start each app in a separate terminal:

```sh
pnpm dev:web
pnpm dev:api
```

The web app uses `http://localhost:5173`. The API listens on `http://localhost:3000`, serves Swagger UI at `/docs`, and reports its database status at `/health/database`. Vite proxies `/api/*` requests to the local API. PostgreSQL is available only on `127.0.0.1:5434`; the username, password, and database name in `compose.yaml` are for local development only.

Apply the checked-in migrations before starting the API:

```sh
pnpm --filter @ernestina-silva/api exec prisma migrate deploy
```

Load the 12 initial players with their optional titles and the 19 team catalog:

```sh
pnpm --filter @ernestina-silva/api exec prisma db seed
```

The seed is safe to rerun: fixed player and team IDs prevent duplicates, and existing names or titles are never overwritten.

With `ENABLE_LOCAL_ADMIN=true` in the API `.env`, an empty local database gets a temporary `admin` / `admin` account. This account cannot sign in when `NODE_ENV=production`, even if the database is reused. Public pages at `/`, `/partidos`, and `/campeonatos` require no account. Sign in at `/admin` to manage the tournament. The admin has separate pages for players (`/admin/jugadores`), teams (`/admin/equipos`), championships (`/admin/campeonatos`), and match results (`/admin/partidos`). Create a championship at `/admin/campeonatos/nuevo` with at least one stage type (groups, league, or knockout), then open its detail to enroll players and assign each a team. Existing championships can add any missing stage type without a custom stage name. The match form offers only players enrolled in the selected championship and uses their assigned teams. A player can have another team in a later championship. Do not use the temporary account for deployed environments.

For a group stage, add named groups (such as A and B) on the championship admin page. New group-stage matches require one of those groups; the match editor can assign a group to older matches, which remain unassigned after migration. Both admin and public match lists show the group when one is assigned.

An admin can remove a mistakenly added stage from the championship page. Its groups are removed, while linked matches keep their players, teams, scores, and championship; only stage and group assignments are cleared. The confirmation explains this impact before deletion.

Public read-only API routes are `GET /tournament/players`, `/tournament/teams`, `/tournament/championships`, `/tournament/stages`, and `/tournament/matches`. Data-entry routes remain under `/admin/*` and require an admin session. Player edits use `PATCH /admin/players/:id`; championship assignments use `GET` and `POST /admin/participants`.

Group definitions are available at `GET /tournament/groups` and `GET /admin/groups`; admins add them with `POST /admin/groups` (`stageId`, `name`). Match creation and correction accept `groupId` alongside `stageId`; the API validates that the group belongs to the selected group stage.

For knockout matches, assign a round (the number of players in that round: 2–64) and a pairing slot in the match form. One match can occupy each stage/round/slot. Older matches keep their results but remain outside the bracket until an admin assigns them. Editing a match never creates the next-round match automatically. A tied knockout score has no derived winner.

Admins can remove a stage with `DELETE /admin/stages/:id`. The operation atomically clears stage/group assignments from linked matches and returns `detachedMatches`; a concurrent conflict rolls back the deletion.

In Swagger UI at `http://localhost:3000/docs`, open `POST /auth/login`, select **Try it out**, enter the local credentials, and execute. The browser stores the HttpOnly session cookie; subsequent protected requests in the same Swagger tab use that session. Do not enter the cookie manually in **Authorize**: browsers do not let Swagger UI set the `Cookie` header.

Stop the local database with `pnpm db:down`. The named volume keeps its data.

## Database schema

`apps/api/prisma/schema.prisma` defines admin users/sessions and the initial tournament records. After changing a model, run:

```sh
pnpm db:migrate
pnpm db:generate
```

Prisma Client is also generated automatically by the API build, development, and e2e test scripts. The generated client is ignored by Git.

## Checks

```sh
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

To exercise the assignment/match concurrency regression against a fresh throwaway database on the local PostgreSQL server, run `RUN_DB_RACE_TEST=1 pnpm test:e2e`. The test needs permission to create and drop a separate database; it does not modify the normal development database.

## Deployment

Deploy `apps/web` and `apps/api` as separate projects. For Vercel, set each project's Root Directory to its app directory and keep the workspace lockfile at the repository root. Connect the hosted PostgreSQL integration to the API project and provide `DATABASE_URL` there; do not expose it to Vite. The Compose database is local only. Run migrations against the hosted database before starting the API and create a real admin account first. The web app is a client-side SPA, so configure its static host to serve `index.html` for direct loads or refreshes of client routes such as `/admin/jugadores` and `/partidos`; this is a static-host fallback, not a server added to the web app. The web app's `/api` proxy is development-only, and the current strict same-site session cookie is designed for local same-origin use. Configure production API routing and authentication before deployment. The public knockout bracket is drawn with CSS grid connectors and a staggered CSS reveal that is disabled under `prefers-reduced-motion`; no animation library is used.

Provision an administrator only after applying migrations to the intended database. From `apps/api`, supply `DATABASE_URL` securely and run:

```sh
pnpm exec prisma migrate deploy
read -r -s 'ADMIN_PASSWORD?Admin password: '; printf '\n'
printf '%s\n' "$ADMIN_PASSWORD" | pnpm admin:create owner
unset ADMIN_PASSWORD
```

The command reads the password from standard input, requires at least 12 UTF-8 bytes, stores a salted `scrypt` hash, and refuses to replace an existing username. Never put the password in a command argument, commit it, or run the command against production without confirming the target database. The local `admin/admin` account is not eligible for production login.
