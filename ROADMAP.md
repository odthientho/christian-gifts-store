# GIN Store — Product Roadmap

Written from a product-owner perspective at the close of the admin-CMS /
cart-persistence phase. Intent: give a future engineer a prioritized backlog,
not a spec — each item names the problem, not the implementation.

Current state: three-service monorepo (NestJS API, Next.js storefront, Next.js
admin), bilingual vi/en, Stripe checkout, JWT auth with cross-device cart
persistence, and an admin CMS covering products, categories, orders (status
only — no refund API integration), hero carousel, and promo tiles.

## Now (highest leverage, build next)

1. **Search relevance.** Product search is almost certainly a simple
   name/description substring match today. For a catalog with vi/en dual-language
   text, that's weak — accented Vietnamese input often won't match unaccented
   stored text. This is the single highest-leverage discovery fix.
2. **Inventory alerts.** Stock is tracked but nothing surfaces low/zero stock to
   the admin proactively. An admin has to notice a product page says "0" —
   easy to miss, leads to overselling or dead listings.
3. **Order fulfillment status beyond PAID/REFUNDED.** Right now there's no
   SHIPPED/DELIVERED tracking or shipping-carrier/tracking-number field on an
   order. A real gift-shipping business needs this before it can operate at
   any volume — customers will ask "where's my order" with nothing to tell them.
4. **Customer order history page.** Signed-in customers can persist a cart
   across devices now, but there's no "my orders" page for them to look back
   at past purchases. That's the natural next step given the auth work just
   landed.

## Next (real value, moderate lift)

5. **Real product reviews/ratings.** The product cards already render star
   icons per the QA summary — confirm whether that's live data or a static
   placeholder. If placeholder, this is a trust-building feature that
   Christian-gift shoppers particularly weight (word-of-mouth culture).
6. **Wishlist / save-for-later.** Common for gift-buying context — someone
   browsing for a wedding or baptism gift often wants to compare across a
   session or send a link to a spouse.
7. **Discount codes / promotions.** No coupon system exists. Even a simple
   percentage-off code tied to an expiry date would unlock basic marketing
   (email campaigns, seasonal sales) without needing a full promotions engine.
8. **Admin: bulk product operations.** CSV import/export for products, or at
   minimum bulk-edit (price, stock, active) — the one-row-at-a-time edit flow
   doesn't scale past a few dozen SKUs.
9. **Abandoned-cart email.** Infrastructure (email sending, if not present)
   would need to be introduced, but it's one of the highest-ROI e-commerce
   levers once traffic exists.

## Later (valuable, but sequence-dependent or higher lift)

10. **Multi-image products.** Products currently have one image. Real gift/book
    listings usually need 3-5 angles or a back-cover shot. This is a schema
    change (Product ↔ Image many-to-many) worth doing once the single-image
    Image model has proven itself in production.
11. **Guest checkout order lookup by email + order number**, independent of
    cart-token cookie survival — today a guest who clears cookies or switches
    browsers loses the ability to view their own order. Registered customers
    are covered by the new order-history page (#4); guests are not.
12. **Admin roles beyond a single ADMIN role.** Right now it's binary
    admin/customer. A growing store usually wants a "fulfillment" role that
    can see/update orders but not touch pricing or delete products.
13. **Site-wide SEO content**: meta descriptions per product/category,
    sitemap.xml, structured data (Product schema.org) — matters once there's
    organic traffic to capture.
14. **Analytics dashboard.** Admin currently has no visibility into
    conversion, top sellers, or traffic sources. Even a lightweight
    "orders this week / revenue this month" tile on the admin home would help.
15. **Real Stripe refund integration.** The current order-status change is
    explicitly DB-only by product decision (avoids accidental real refunds).
    Once the team trusts the flow, wiring the "REFUNDED" status to an actual
    Stripe refund call (behind a confirmation step) closes the loop — but this
    is deliberately sequenced last since a wrong refund is real money.

## Explicitly out of scope until there's a signal to build them

- Multi-currency / international shipping — no evidence of demand yet.
- Subscription/recurring orders (e.g. monthly devotional box) — a distinct
  product line, not a checkbox feature; needs its own validation first.
- Native mobile app — the site is responsive; a dedicated app is a large
  investment that should follow proven engagement, not precede it.

## Suggested sequencing rationale

The "Now" section is ordered by what's missing that a customer or admin will
notice *this week*: unfindable products, invisible stockouts, no shipping
status, no order history despite having just built cross-device auth. The
"Next" section is revenue/marketing leverage once the operational basics are
solid. "Later" items are either larger schema commitments (multi-image,
roles) or carry real financial risk (live refunds) and benefit from the store
having real usage data before locking in a design.
