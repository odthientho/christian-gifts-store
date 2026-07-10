# Build Plan — Cornerstone Christian Gifts & Books

A custom e-commerce system in three parts: a public storefront, a role-gated
admin dashboard, and the backend API and services behind both.

This document is the plan the system was built against, and the reference for
extending it. Phases 0–6 are complete and verified; Phase 7 onward is the
roadmap.

---

## 1. Architecture

One Next.js application, not three deployables. The "backend API" is the Server
Action and Route Handler layer — it runs on the server, owns the database, and
is the only thing that talks to Stripe. The storefront and admin are two route
groups rendered by that same server.

```
Browser (storefront)  ─┐
                       ├─→  Next.js server  ─→  Prisma  ─→  PostgreSQL
Browser (admin)       ─┘         │
                                 └─→  Stripe API
Stripe  ──webhook──────────────→ /api/stripe/webhook
```

Why one app rather than a separate API service: a separate service would need
its own auth, its own deploy, and a network hop for every product read, while
buying nothing here — there is no second consumer of the API. Server Actions
give a typed function call across the network boundary with no REST layer to
maintain. If a mobile client ever appears, the `server/` directory is already
the service layer and can be re-exposed over HTTP without touching the UI.

### Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js App Router, TypeScript strict | 16.2 |
| UI | Tailwind CSS v4 + shadcn/ui (Base UI) | — |
| Database | PostgreSQL via Docker | 17 |
| ORM | Prisma with `@prisma/adapter-pg` | 7.8 |
| Auth | Auth.js (NextAuth v5) + Prisma adapter | 5.0 beta |
| Payments | Stripe Checkout + webhooks | 22.3 |
| Validation | Zod on every external input | 4.4 |

Three version notes that shaped the code, because they differ from older
tutorials:

- **Next 16** removed synchronous `params`, `searchParams`, `cookies()` and
  `headers()`. All are awaited. `middleware.ts` is now `proxy.ts`.
- **Prisma 7** requires an explicit driver adapter and generates a TypeScript
  client into a path you choose (here `lib/generated/`, gitignored).
- **shadcn/ui** now builds on Base UI, which has no `asChild` prop. Links that
  look like buttons use `buttonVariants()` rather than `<Button asChild>`.

### Layout

```
app/(storefront)/     home, /books, /gifts, /products/[slug], /cart, /checkout/success
app/(admin)/admin/    dashboard, products CRUD, orders — role-gated
app/(auth)/           login, register
app/api/              auth handler, Stripe webhook
lib/db.ts             Prisma singleton — the only client in the process
lib/auth.ts           Auth.js config, getCurrentUser(), requireAdmin()
lib/stripe.ts         Stripe singleton (lazy)
lib/money.ts          cents ⇄ display formatting
lib/cart.ts           cart reads for Server Components
lib/validations/      Zod schemas, one file per domain
server/               Server Actions — the mutation layer
prisma/schema.prisma  data model
proxy.ts              optimistic /admin redirect (NOT authorization)
```

---

## 2. Data model

Full schema in `prisma/schema.prisma`.

- `User` — `role` is `USER | ADMIN`. `passwordHash` is nullable so an OAuth
  provider can be added without a migration.
- `Product` — carries a `type` of `BOOK | GIFT`. Type-specific fields live in
  `BookDetail` and `GiftDetail`, one-to-one, rather than as a wide table of
  nullable columns. Adding a third type means a new enum value and a new detail
  table, not a schema-wide change.
- `Cart` / `CartItem` — one cart per signed-in user (`userId`) or per anonymous
  browser (`guestToken`, held in an httpOnly cookie).
- `Order` / `OrderItem` — `OrderItem` snapshots `titleSnapshot` and
  `unitPriceCents` at purchase time. Products get renamed and repriced; a
  historical order must not change when they do. `Order.cartId` records which
  cart it came from so the webhook can empty the right one, guest or not.

**Money is always an integer number of cents.** `$12.99` is `1299`, stored as
`Int`. Floating point cannot represent `0.1`, so summing dollars as `number`
drifts. Conversion happens only at the edges: `dollarsToCents` on input,
`formatCents` on display. There is one helper for each, in `lib/money.ts`.

---

## 3. Security model

These are the rules the code is written to, not aspirations.

1. **Secrets live only in `.env`**, which is gitignored. `.env.example` is the
   committed template. This repository is public — the `.gitignore` was fixed to
   un-ignore `.env.example` *before* the first commit, and no secret has ever
   been staged.

2. **Authorization is server-side, per-request, every time.**
   `proxy.ts` bounces signed-out visitors away from `/admin`, but it only checks
   that a session *cookie exists* — it cannot verify the signature or the role,
   and it never runs before a Server Action. Every `/admin` page and every admin
   Server Action calls `requireAdmin()` itself.
   *Verified:* an authenticated non-admin, whose cookie satisfies `proxy.ts`, is
   still redirected off `/admin` by `requireAdmin()`.

3. **Client-sent prices are never trusted.** Add-to-cart accepts a product id
   and a quantity. Checkout accepts an email. Every line price, subtotal,
   shipping charge and total is recomputed from the database inside
   `createCheckoutSessionAction` before a Stripe session exists.

4. **Stripe webhooks verify the signature against the raw body.**
   `req.text()` gives the exact bytes Stripe signed; parsing to JSON and
   re-serializing would break the check. An unverified body reaches no database
   code. The handler is idempotent — Stripe retries, and marking an order paid
   is guarded by `status: "PENDING"` inside a transaction, so a redelivery
   updates zero rows and stock is never decremented twice.
   *Verified:* tampered body → 400; valid → 200; redelivered → stock decremented
   once, not twice.

5. **Card data never touches this server.** Stripe Checkout hosts the payment
   form. The app stores a session id and a payment-intent id, nothing more.

6. **Passwords** are bcrypt at cost 12. The credentials provider compares
   against a valid dummy hash when the email is unknown, so an attacker cannot
   distinguish "no such user" from "wrong password" by timing. (`bcrypt.compare`
   returns instantly on a malformed hash string — the dummy must be a real
   digest at the same cost, or the defence does nothing.)

7. **Roles are never accepted from input.** Registration always writes
   `role: USER`. Order status changes are checked against an allowlist.

8. **Open-redirect guard.** `?callbackUrl=` is rejected unless it is a
   same-site path.

9. **An order number is not a capability.** `/checkout/success?order=…` returns
   the order only if the caller owns it (signed-in user) or still holds the
   httpOnly guest-cart cookie the order was created from. A guessed order number
   is indistinguishable from a nonexistent one. The page is `noindex` and
   `force-dynamic`.
   *Verified:* before the fix, an anonymous `curl` printed a stranger's item and
   total; after, it prints nothing.

10. **Stock cannot go negative.** Checkout's stock check and the webhook's
    decrement are not one atomic step, so two buyers can both pass the check
    before either pays. The decrement is a conditional
    `updateMany({ where: { stock: { gte: qty } } })` — the database arbitrates,
    and the loser gets `count === 0`. That order stays `PAID` (the customer was
    charged) and is flagged `needsReview` for a human to refund or restock.
    *Verified:* two concurrent paid webhooks against one unit of stock left it at
    0, not −1, and flagged the loser.

11. **Auth endpoints are rate limited.** 8 sign-ins per IP per 10 minutes, 5
    registrations per hour, 20 checkout sessions per 10 minutes. Applied in
    `proxy.ts` (for direct POSTs to the Auth.js endpoint) *and* inside the Server
    Actions, because `signIn` runs in-process and never passes through the proxy.
    *Verified:* the 9th sign-in attempt returns 429.
    **Caveat:** the counter lives in process memory. It stops one machine
    guessing one instance. Behind a horizontally scaled deploy, move it to Redis —
    `lib/rate-limit.ts` keeps its interface.

12. **CSP with a per-request nonce**, plus `X-Frame-Options`, `nosniff`,
    `Referrer-Policy`, `Permissions-Policy`, and HSTS in production.
    `script-src` is `'self' 'nonce-…' 'strict-dynamic'`. `style-src` allows
    `'unsafe-inline'` because Tailwind v4 and Sonner inject style tags a nonce
    cannot cover — style injection is a far weaker vector, and `script-src` stays
    strict. `x-powered-by` is off.
    *Verified:* headers present, and the browser console reports zero CSP
    violations across the storefront.

---

## 4. Build phases

### Phase 0 — Foundation ✅
Scaffold Next.js + TypeScript strict + Tailwind. Fix `.gitignore` so `.env*` is
ignored but `.env.example` is not. Install Prisma, Auth.js, Stripe, Zod.

### Phase 1 — Database ✅
`docker-compose.yml` running Postgres 17 on host port **5433** (5432 is left
free for any Postgres already installed). Schema, two migrations, seed script.

### Phase 2 — Core singletons ✅
`lib/db.ts` (cached on `globalThis` so dev hot-reload doesn't exhaust the
connection pool), `lib/auth.ts`, `lib/stripe.ts` (lazy, so the storefront
renders before Stripe keys exist), `lib/money.ts`.

### Phase 3 — Storefront ✅
Home with featured products, `/books` and `/gifts` with category filters,
product detail with type-specific specs, cart with live quantity editing and a
free-shipping threshold.

### Phase 4 — Checkout ✅
Server Action → `PENDING` order → Stripe Checkout Session carrying
`metadata.orderId`. Webhook → verify → mark `PAID`, decrement stock, capture the
shipping address, empty the cart. All inside one transaction, all idempotent.

### Phase 5 — Admin ✅
Dashboard (product count, order count, paid revenue, low stock, recent orders),
product create/edit/delete, order list with status control. Deleting a product
that appears on a past order soft-deletes it (`active: false`) so order history
keeps its link.

### Phase 6 — Auth ✅
Email + password sign-in, registration, sign-out, role in the JWT (re-read from
the database on each request so revoking admin takes effect immediately rather
than at token expiry).

### Phase 7 — Next steps (not built)
In rough priority order:

1. **Product images.** Currently a URL field with an emoji placeholder. Wants
   real uploads: S3 or Vercel Blob, a signed upload action, and `next/image`
   with the host allowlisted in `next.config.ts`.
2. **Order confirmation email.** Resend or Postmark, triggered from the webhook
   after the order is marked paid — inside the same transaction's success path,
   not before it.
3. **Search.** Postgres full-text over `title` and `description`; the current
   `contains` filter is fine at 16 products and will not stay fine.
4. **Customer order history.** `/account/orders`, gated by `requireUser()`.
5. **Refunds from the admin.** `stripe.refunds.create`, guarded by
   `requireAdmin()`; the `charge.refunded` webhook already writes `REFUNDED`.
6. **Discount codes** and **tax** (`taxCents` exists on `Order` and is always 0).
7. **Automated tests.** The verifications in section 5 were run by hand. The
   webhook idempotency case, the oversell race, and the order-page IDOR each
   deserve to be permanent regression tests — they are exactly the failures that
   a future refactor would reintroduce silently.
8. ~~Guest cart adoption on sign-in.~~ Done: merged in the Auth.js `signIn`
   event, with a Server Action fallback.
9. **Distributed rate limiting.** `lib/rate-limit.ts` counts in process memory.
   Swap the store for Redis before running more than one instance.
10. **`npm audit`** reports a moderate advisory in `postcss`, reached only as a
    transitive dependency of Next itself. `npm audit fix --force` would downgrade
    Next to v9; leave it until Next ships a bump.

---

## 5. What was verified, and how

Run against the real dev server and a real Postgres, not mocks.

| Check | Result |
|---|---|
| All 7 public routes | 200 |
| Home / catalog render seeded data | 6 featured, 8 books, 8 gifts |
| Category filters | `?category=theology` → 3 books; `?category=jewelry` → 2 gifts |
| Money formatting | `4999` cents renders `$49.99` |
| Cart under threshold | $10.99 + $5.99 shipping = $16.98; "Add $39.01 more" |
| Cart over threshold | $60.98, shipping Free, total $60.98 |
| `/admin` signed out | 307 → `/login?callbackUrl=/admin` |
| `/admin` as **authenticated non-admin** | 307 → `/` (`requireAdmin()`, not proxy) |
| `/admin` as admin | 200, dashboard renders 16 products |
| Wrong password | no session issued |
| Webhook, no signature | 400 |
| Webhook, tampered body | 400 |
| Webhook, valid signature | 200, order `PAID`, address captured |
| Webhook, **redelivered** | 200, stock decremented **once** (40 → 38, not 36) |
| Order page, anonymous, guessed number | **before:** leaked item + total · **after:** nothing |
| Two concurrent paid webhooks, 1 unit of stock | **before:** stock −1 (oversold) · **after:** stock 0, loser flagged `needsReview` |
| 9th sign-in attempt from one IP | 429 |
| CSP / security headers | present; zero console violations |
| `x-powered-by` | removed |
| Guest cart + sign-in | 3 items merged into the user cart, guest cart deleted |
| Dark mode toggle | `.dark` applied, persisted to localStorage |
| `npm run build` | passes |
| `tsc --noEmit` / `eslint` | clean |

---

## 6. Running it

```bash
cp .env.example .env          # then fill in AUTH_SECRET and Stripe keys
npm install
npm run db:up                 # Postgres 17 in Docker on :5433
npm run db:migrate
npm run db:seed               # 16 products, 7 categories, 1 admin
npm run dev
```

Sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.

For checkout, add Stripe **test** keys to `.env` and run
`npm run stripe:listen` in a second terminal to forward webhook events.

### A note on the local Docker runtime

Docker Desktop is not required. This machine runs **Colima**, a headless Docker
runtime (`brew install colima docker docker-compose`, then `colima start`).
`docker compose` needs the compose plugin symlinked into `~/.docker/cli-plugins/`
when installed via Homebrew. `docker-compose.yml` is unchanged by any of this.
