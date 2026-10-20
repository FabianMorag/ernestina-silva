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

With `ENABLE_LOCAL_ADMIN=true` in the API `.env`, an empty local database gets a temporary `admin` / `admin` account. This account cannot sign in when `NODE_ENV=production`, even if the database is reused. Public pages at `/`, `/partidos`, and `/campeonatos` require no account. Sign in at `/admin` to add players, teams, championships, optional stages, and match results. Do not use the temporary account for deployed environments.

Public read-only API routes are `GET /tournament/players`, `/tournament/teams`, `/tournament/championships`, `/tournament/stages`, and `/tournament/matches`. Data-entry routes remain under `/admin/*` and require an admin session.

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

## Deployment

Deploy `apps/web` and `apps/api` as separate projects. For Vercel, set each project's Root Directory to its app directory and keep the workspace lockfile at the repository root. Connect the hosted PostgreSQL integration to the API project and provide `DATABASE_URL` there; do not expose it to Vite. The Compose database is local only. Run migrations against the hosted database before starting the API and create a real admin account first. The web app's `/api` proxy is development-only, and the current strict same-site session cookie is designed for local same-origin use. Configure production API routing and authentication before deployment. Motion and custom SVG visuals are intentionally not included yet.
