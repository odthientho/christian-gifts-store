# Cornerstone — Christian Gifts & Books

A full e-commerce system for selling Christian books and gifts: a public
storefront, a role-gated admin dashboard, and the backend that serves both.

Built with Next.js 16 (App Router), TypeScript, PostgreSQL via Prisma 7,
Auth.js, Stripe Checkout, and Tailwind + shadcn/ui.

## Features

**Storefront**
- Featured products on the home page
- Separate `/books` and `/gifts` catalogs, filterable by category
- Product pages with type-specific details (author/ISBN/format for books,
  material/dimensions/occasion for gifts)
- Guest cart backed by an httpOnly cookie, or a persistent cart when signed in
- Free shipping above $50, flat $5.99 below
- Stripe Checkout, with the order total recomputed server-side

**Admin** (`/admin`, admins only)
- Dashboard: active products, order count, paid revenue, low-stock warnings
- Product create / edit / delete, with book and gift variants
- Order list with status control

**Backend**
- Server Actions as the mutation layer, each re-checking authorization
- Zod validation on every external input
- Stripe webhook with signature verification and idempotent fulfilment

## Quick start

Requires Node 20.9+, and Docker (or [Colima](https://github.com/abiosoft/colima)).

```bash
cp .env.example .env
```

Fill in `.env` — generate the auth secret with:

```bash
npx auth secret
```

Then:

```bash
npm install
npm run db:up        # Postgres 17 on localhost:5433
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. Sign in at `/login` with the seeded admin
credentials (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`) to reach
`/admin`.

### Payments

Checkout stays disabled, with a visible notice, until Stripe keys are present.
Add test keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys)
to `.env`, then forward webhooks in a second terminal:

```bash
npm run stripe:listen
```

Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | Start / stop Postgres |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed catalog + admin user |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Drop, re-migrate, re-seed |
| `npm run stripe:listen` | Forward Stripe webhooks locally |

## Project layout

```
app/(storefront)/   public pages
app/(admin)/admin/  admin dashboard — role-gated
app/(auth)/         login, register
app/api/            auth handler, Stripe webhook
lib/                db, auth, stripe, money, cart, validations
server/             Server Actions (the mutation layer)
prisma/             schema, migrations, seed
proxy.ts            optimistic /admin redirect — not authorization
```

## Conventions

- **Money is integer cents.** `$12.99` is `1299`. Format only at display time
  with `lib/money.ts`.
- **Server Components by default**; `"use client"` only where there is
  interactivity.
- **All database access goes through the `lib/db.ts` singleton.**
- **Every admin route and action calls `requireAdmin()`.** Hiding a link is not
  access control, and neither is `proxy.ts`.
- **Never trust a client-sent price.** Recompute from the database.

See [PLAN.md](PLAN.md) for the architecture, the security model, what was
verified, and the roadmap.

## License

MIT
