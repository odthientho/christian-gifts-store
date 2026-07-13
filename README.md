# GIN Store — monorepo

Headless Christian gifts & books commerce, split into independently deployable
services so more can be added later. **Growing Faith. Inspiring Hope. Nurturing Love.**

## Structure

```
packages/
  db/          @gin/db        Prisma schema, migrations, seed. Owns the database.
                              Exposes the client to the API; the storefront
                              generates its own client from the same schema.
  contracts/   @gin/contracts Shared Zod schemas + DTO types + money helpers.
                              One wire contract for every service.
apps/
  api/         @gin/api       NestJS. All business logic and HTTP endpoints.
                              The only service that talks to the database for
                              product reads/writes.
  storefront/  @gin/storefront Next.js customer store. Reads products from the API.
  admin/       @gin/admin     Next.js admin dashboard (in progress).
```

Why a monorepo of separate apps rather than one app: each service builds and
deploys on its own, but they share one schema and one set of types, so a
change to the contract is a single edit — not a coordinated release across
three repositories.

## Migration status (Products vertical slice)

The **Products** domain is fully headless: the storefront reads it over HTTP
from the API. The remaining domains — cart, checkout, orders, auth — still read
Postgres directly from the storefront during the migration, and move to the API
one slice at a time.

| Domain    | Storefront reads from       | Status |
|-----------|-----------------------------|--------|
| Products  | GIN API (`/api/products`)   | ✅ migrated |
| Cart      | Postgres (direct)           | pending |
| Checkout  | Postgres + Stripe (direct)  | pending |
| Orders    | Postgres (direct)           | pending |
| Auth      | Auth.js + Postgres (direct) | pending |

## Running it

```bash
npm install
npm run db:up          # Postgres in Docker (port 5433)
npm run db:migrate     # apply migrations
npm run db:seed        # seed products + admin user

# each service in its own terminal
npm run dev -w @gin/api          # http://localhost:4000/api
npm run dev -w @gin/storefront   # http://localhost:3000
```

The API's admin endpoints are guarded by a bearer token (`ADMIN_API_TOKEN`) for
now; the full JWT auth slice replaces that with real login + role claims. Rate
limiting, security headers (helmet), CORS, and Zod validation are enforced at
the API boundary.

## Tech

Next.js 16 · NestJS 11 · Prisma 7 (Postgres) · Zod · Stripe · Turborepo · TypeScript.
Storefront is bilingual (vi/en) with a coral/ice-blue theme.
