# Cloudflare Comfort Stack

A production-ready, fully type-safe full-stack monorepo template running entirely on Cloudflare's infrastructure. OpenAPI-first: one spec drives both the typed React Query client and server-side Zod validators.

---

## Stack

| Layer | Technology |
|---|---|
| **Runtime** | Cloudflare Workers + D1 + R2 + KV |
| **API** | Hono v4 |
| **Database ORM** | Drizzle ORM (SQLite / D1) |
| **Auth** | Better Auth + better-auth-cloudflare |
| **API Codegen** | Orval (OpenAPI → React Query hooks + Zod validators) |
| **Frontend** | React 19 + Vite + TailwindCSS v4 + shadcn/ui |
| **Routing** | Wouter |
| **Data Fetching** | TanStack Query v5 |
| **Landing** | Astro v6 |
| **Monorepo** | pnpm workspaces |
| **Linting/Formatting** | Biome |
| **Language** | TypeScript ~5.9 |

---

## Architecture

```
my-app/
├── apps/
│   ├── api/       # Hono API → Cloudflare Workers
│   ├── app/       # React SPA → Cloudflare Pages
│   └── landing/   # Astro landing page → Cloudflare Pages
└── libs/
    ├── api-spec/         # openapi.yaml + orval.config.ts (source of truth)
    ├── api-client-react/ # Generated: TanStack Query hooks (@myapp/api-client-react)
    ├── api-zod/          # Generated: Zod validators (@myapp/api-zod)
    ├── auth/             # Better Auth config (@myapp/auth)
    └── db/               # Drizzle schema + D1 client (@myapp/db)
```

### OpenAPI-first flow

`libs/api-spec/openapi.yaml` is the **single source of truth** for your API contract. Running `pnpm codegen` drives the entire client generation pipeline:

- **`libs/api-client-react/src/generated/`** — Fully-typed TanStack Query hooks (e.g. `useListItems`, `useCreateItem`) backed by a production-quality `customFetch` mutator with structured error handling.
- **`libs/api-zod/src/generated/`** — Zod validators for every request/response schema, ready to use in your Hono route handlers for runtime validation.

No manual API client code. Change the spec → run `pnpm codegen` → your entire stack is in sync.

---

## Prerequisites

- **Node.js** >= 22
- **pnpm** >= 10 — `npm i -g pnpm`
- **Wrangler CLI** — `npm i -g wrangler`
- A **Cloudflare account** (free tier works for development)

---

## Quick Start

### 1. Use this template / clone

Click **"Use this template"** on GitHub, or clone directly:

```
git clone https://github.com/your-org/my-app.git
cd my-app
```

### 2. Install dependencies

```
pnpm install
```

### 3. Configure local environment variables

Copy the example dev vars file in `apps/api/` and fill in your values:

```
cp apps/api/.dev.vars.example apps/api/.dev.vars
# Then edit apps/api/.dev.vars with your credentials
```

### 4. Create Cloudflare resources

Authenticate with Cloudflare, then create the required resources:

```
# Log in to Cloudflare
wrangler login

# Create a D1 database
wrangler d1 create my-app-db

# Create a KV namespace (used by Better Auth for rate limiting / sessions)
wrangler kv namespace create AUTH_KV

# Create an R2 bucket (if needed for file storage)
wrangler r2 bucket create my-app-bucket
```

### 5. Update wrangler config

Paste the IDs printed by the commands above into `apps/api/wrangler.jsonc` — replace the placeholder `database_id` and `namespace_id` values.

### 6. Generate the auth schema

```
pnpm better-auth:generate
```

This runs the Better Auth CLI against `libs/auth/src/index.ts` and outputs the auth tables schema to `libs/db/src/schema/auth.ts`. Then uncomment the `export * from "./auth"` line in `libs/db/src/schema/index.ts`.

### 7. Push the schema to your local D1

Start the API dev server first so Wrangler creates the local D1 SQLite file:

```
# In one terminal — this creates .cloudflare-state/v3/d1/*.sqlite
pnpm dev:api

# In another terminal
pnpm db:push:local
```

### 8. Generate the API client

```
pnpm codegen
```

This generates typed React Query hooks into `libs/api-client-react/src/generated/` and Zod validators into `libs/api-zod/src/generated/`.

### 9. Start development

```
# Terminal 1 — Hono API on http://localhost:8787
pnpm dev:api

# Terminal 2 — React SPA on http://localhost:5173
pnpm dev:app
```

---

## Scripts Reference

| Script | Description |
|---|---|
| `pnpm dev:api` | Start the Hono API via Wrangler (`apps/api`) |
| `pnpm dev:app` | Start the React SPA via Vite (`apps/app`) |
| `pnpm dev:landing` | Start the Astro landing page (`apps/landing`) |
| `pnpm codegen` | Run Orval to regenerate React Query hooks and Zod validators from `openapi.yaml` |
| `pnpm better-auth:generate` | Run the Better Auth CLI to regenerate `libs/db/src/schema/auth.ts` |
| `pnpm db:push:local` | Push the Drizzle schema to the local D1 SQLite file |
| `pnpm db:push:remote` | Push the Drizzle schema to the remote Cloudflare D1 database via HTTP API |
| `pnpm db:studio:local` | Open Drizzle Studio connected to the local D1 SQLite file |
| `pnpm db:studio:remote` | Open Drizzle Studio connected to the remote Cloudflare D1 database |
| `pnpm format` | Format all files with Biome |
| `pnpm lint` | Lint all files with Biome (read-only) |
| `pnpm lint:fix` | Lint and auto-fix all files with Biome |
| `pnpm test:api` | Run Vitest unit tests for the API (`apps/api`) |
| `pnpm test:api:watch` | Run Vitest in watch mode for the API |
| `pnpm test:e2e` | Run Playwright E2E tests headlessly (`apps/app`) |
| `pnpm test:e2e:ui` | Run Playwright E2E tests with the interactive UI runner |

---

## Environment Variables

### `apps/api/.dev.vars` (local development only)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `BETTER_AUTH_URL` | Base URL for auth callbacks (e.g. `http://localhost:5173`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173`) |

### Remote deployment secrets

These are **not** stored in `.dev.vars`. Set them via `wrangler secret put` or the Cloudflare dashboard:

| Variable | Description |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (used by `db:push:remote`) |
| `CLOUDFLARE_DATABASE_ID` | The D1 database ID to target for remote pushes |
| `CLOUDFLARE_D1_TOKEN` | A Cloudflare API token with D1 edit permissions |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (production) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (production) |
| `BETTER_AUTH_URL` | Base URL for auth callbacks (production, e.g. `https://app.example.com`) |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins (production) |

---

## Adding a New API Route

Follow this workflow to keep the entire stack in sync:

### 1. Update the OpenAPI spec

Add your new path and schema definitions to `libs/api-spec/openapi.yaml`:

```
# Example: add a new /widgets resource
paths:
  /widgets:
    get:
      operationId: listWidgets
      tags: [widgets]
      summary: List widgets
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Widget"
components:
  schemas:
    Widget:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
      required: [id, label]
```

### 2. Regenerate the client and validators

```
pnpm codegen
```

This regenerates:
- `libs/api-client-react/src/generated/` — new `useListWidgets` hook and friends
- `libs/api-zod/src/generated/` — new `widgetSchema` and request validators

### 3. Create the Hono route handler

```
import { Hono } from "hono";
import type { AppEnv } from "../types";

export const widgetsRouter = new Hono<AppEnv>();

widgetsRouter.get("/", async (c) => {
  const db = c.get("db");
  const widgets = await db.query.widgets.findMany();
  return c.json(widgets);
});
```

### 4. Register the router

In `apps/api/src/index.ts`, mount the new router:

```
import { widgetsRouter } from "./routes/widgets";

app.route("/api/widgets", widgetsRouter);
```

### 5. Use the generated hook in React

```
import { useListWidgets } from "@myapp/api-client-react";

export function WidgetList() {
  const { data, isLoading } = useListWidgets();
  if (isLoading) return <p>Loading...</p>;
  return <ul>{data?.map((w) => <li key={w.id}>{w.label}</li>)}</ul>;
}
```

---

## Database Workflow

- **Schema location**: `libs/db/src/schema/*.ts` — add a new file per entity and re-export it from `libs/db/src/schema/index.ts`.
- **Auth schema**: Auto-generated by `pnpm better-auth:generate` — outputs to `libs/db/src/schema/auth.ts`. Do not edit this file manually; re-run the command after changing auth config.
- **Local dev**: `pnpm db:push:local` reads the `.sqlite` file from `.cloudflare-state/v3/d1/` which is created automatically the first time you run `pnpm dev:api`.
- **Remote**: `pnpm db:push:remote` calls the D1 HTTP API. Requires `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_D1_TOKEN` in your environment.
- **Drizzle Studio**: `pnpm db:studio:local` or `pnpm db:studio:remote` opens a browser-based DB browser.

> **Note**: The `tablesFilter` in `drizzle.config.ts` excludes `_cf_KV` (internal Cloudflare) and `auth_*` (managed by Better Auth) tables so Drizzle Kit never touches them.

---

## Auth Setup

Auth is configured in `libs/auth/src/index.ts` using `createAuth()`.

**Supported providers out of the box:**
- Email & password
- Google OAuth

**After changing auth configuration:**

```
pnpm better-auth:generate
```

This regenerates the auth database schema. Uncomment (or keep uncommented) `export * from "./auth"` in `libs/db/src/schema/index.ts`, then run `pnpm db:push:local` to apply the changes locally.

**Mounting the auth handler:**

The auth handler is mounted at `/api/auth/*` in the Hono app (`apps/api/src/index.ts`):

```
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env, c.req.raw.cf as any);
  return auth.handler(c.req.raw);
});
```

**Client-side:**

Use the `authClient` exported from `apps/app/src/lib/auth-client.ts` to call sign-in, sign-up, and session endpoints from your React components.

---

## Deployment

### API (Cloudflare Workers)

```
pnpm --filter api run deploy
```

This runs `wrangler deploy` from `apps/api/`. Make sure your production secrets are set:

```
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put BETTER_AUTH_URL
wrangler secret put ALLOWED_ORIGINS
```

### App (Cloudflare Pages)

1. Connect `apps/app` to a new Cloudflare Pages project in the dashboard.
2. Set **build command**: `pnpm build`
3. Set **build output directory**: `dist`
4. Set **root directory**: `apps/app`
5. Add environment variables in the Pages dashboard.

### Landing (Cloudflare Pages)

Same steps as the App above, using `apps/landing` as the root directory.

### Push schema to production D1

```
export CLOUDFLARE_ACCOUNT_ID=your_account_id
export CLOUDFLARE_DATABASE_ID=your_db_id
export CLOUDFLARE_D1_TOKEN=your_token
pnpm db:push:remote
```

---

## License

MIT
