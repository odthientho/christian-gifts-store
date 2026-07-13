# GIN Store — headless Christian gifts & books commerce

**Growing Faith. Inspiring Hope. Nurturing Love.**

A monorepo split into three independently deployable services plus shared
packages, so new services can be added without disturbing the others.

```
apps/
  api/         NestJS — all business logic + the only thing that touches the DB
  storefront/  Next.js 16 — the bilingual (vi/en) customer store, consumes the API
  admin/       Next.js 16 — the role-gated admin dashboard, consumes the API
packages/
  db/          Prisma schema, migrations, seed, generated client (@gin/db)
  contracts/   Shared Zod schemas, DTO types, money + shipping helpers (@gin/contracts)
```

The two UIs never touch the database — every read and write goes over HTTP to
the API, which owns products, categories, cart, checkout, orders, the Stripe
webhook, and auth. Shared types live in `@gin/contracts`, so the wire format is
defined once and consumed by all three apps.

## Running it

Prerequisites: Node 20.9+, Docker (Postgres). From the repo root:

```bash
npm install
npm run db:up            # start Postgres (docker compose)
npm run db:migrate       # apply migrations   (packages/db)
npm run db:seed          # seed demo catalog + admin user

# each service (separate terminals, or `npm run dev` for all via turbo)
npm run dev -w @gin/api          # API        → http://localhost:4000/api
npm run dev -w @gin/storefront   # storefront  → http://localhost:3000
npm run dev -w @gin/admin        # admin       → http://localhost:3001
```

Each app has its own `.env` (copy from the `.env.example` beside it). The API
needs `DATABASE_URL`, `JWT_SECRET`, and — for checkout — `STRIPE_SECRET_KEY` /
`STRIPE_WEBHOOK_SECRET`. Without Stripe keys the store runs fine; checkout
returns a clear "not configured" message.

## Security (enforced at the API boundary)

- **Auth** is JWT: the API signs a role-carrying token; the UIs hold it in an
  httpOnly cookie and never inspect it. `RolesGuard` gates every admin endpoint.
- **Prices are never trusted from the client.** Cart and checkout recompute
  every total from database prices; the client sends only ids and quantities.
- **Order lookup is IDOR-safe:** an order is returned only to the holder of the
  cart token it was created from — otherwise null, indistinguishable from
  "not found".
- **The Stripe webhook** verifies the signature against the raw body and is
  idempotent; stock is decremented conditionally so racing buyers can't oversell
  (the loser's order is flagged for review).
- Money is integer cents everywhere.

## Storefront design

Bilingual Tiếng Việt / English (defaults to Vietnamese) with a header toggle;
coral-and-ice-blue palette and Be Vietnam Pro + Playfair Display type, adapted
from the reference store at codochaidang.com. Prices are USD.
