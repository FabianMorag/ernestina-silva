# Ernestina Silva

React/Vite frontend and NestJS/Fastify API in one pnpm workspace.

## Local development

Install dependencies from the repository root:

```sh
pnpm install
```

Start each app in a separate terminal:

```sh
pnpm dev:web
pnpm dev:api
```

The web app uses Vite's default local URL (`http://localhost:5173`). The API listens on `http://localhost:3000`.

## Checks

```sh
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

## Deployment

Deploy `apps/web` and `apps/api` as separate projects. For Vercel, set each project's Root Directory to its app directory and keep the workspace lockfile at the repository root. The API is a NestJS application and may need a different host if it later requires persistent background processes.
