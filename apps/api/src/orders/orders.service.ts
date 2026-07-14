import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { prisma } from "@gin/db";
import {
  shippingForSubtotal,
  type OrderDTO,
  type AdminOrderDTO,
  type AdminOrderListItemDTO,
  type OrderStatusDTO,
  type DashboardSummaryDTO,
  type MyOrderListItemDTO,
  type CheckoutInput,
  type CheckoutResultDTO,
  ORDER_STATUSES,
} from "@gin/contracts";

import { StripeService } from "./stripe.service.js";
import { LOW_STOCK_THRESHOLD } from "../products/products.service.js";

function newOrderNumber(): string {
  return `GIN-${randomBytes(4).toString("hex").toUpperCase()}`;
}

// Online payment is off for now — Stripe is still fully wired up (below) so
// it's a one-line flip to turn back on, but until then every order is placed
// directly and an admin collects payment and confirms it manually.
const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";

// Orders in these statuses represent money actually collected — used both for
// the dashboard's revenue total and for attributing category/day revenue.
const REVENUE_STATUSES: OrderStatusDTO[] = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"];
const REVENUE_HISTORY_DAYS = 14;

@Injectable()
export class OrdersService {
  constructor(private readonly stripe: StripeService) {}

  /** Whether checkout collects real payment or just places the order. */
  paymentsEnabled(): boolean {
    return PAYMENTS_ENABLED;
  }

  /**
   * Turn a cart into an order. `userId`, when the caller is signed in, wins
   * over `cartToken` — same precedence as the cart endpoints. Line items and
   * every total are read from the database — a price that arrived over the
   * wire is never used.
   *
   * With PAYMENTS_ENABLED, this also creates a Stripe Checkout Session and
   * returns its URL; the order stays PENDING until the webhook confirms
   * payment and reserves stock. Without it, the order is placed directly as
   * PENDING with stock reserved immediately — there is no separate "payment
   * succeeded" event to hook into when a human collects payment manually
   * later, so the reservation has to happen at order-placement time instead.
   */
  async createCheckout(
    input: CheckoutInput,
    userId: string | undefined,
    siteUrl: string,
  ): Promise<CheckoutResultDTO> {
    if (PAYMENTS_ENABLED && !this.stripe.isConfigured()) {
      throw new BadRequestException(
        "Payments are not configured. Add STRIPE_SECRET_KEY to enable checkout.",
      );
    }

    const cart = userId
      ? await prisma.cart.findUnique({
          where: { userId },
          include: { items: { include: { product: true } } },
        })
      : input.cartToken
        ? await prisma.cart.findUnique({
            where: { guestToken: input.cartToken },
            include: { items: { include: { product: true } } },
          })
        : null;
    const lines = (cart?.items ?? []).filter((i) => i.product.active);
    if (!cart || lines.length === 0) {
      throw new BadRequestException("Your cart is empty.");
    }

    // Re-check stock at the moment of purchase.
    for (const line of lines) {
      if (line.quantity > line.product.stock) {
        throw new BadRequestException(
          `"${line.product.title}" only has ${line.product.stock} left in stock.`,
        );
      }
    }

    const subtotalCents = lines.reduce(
      (s, l) => s + l.product.priceCents * l.quantity,
      0,
    );
    const shippingCents = shippingForSubtotal(subtotalCents);
    const totalCents = subtotalCents + shippingCents;

    const shippingFields = {
      shippingName: input.name,
      shippingPhone: input.phone,
      shippingLine1: input.addressLine1,
      shippingLine2: input.addressLine2 ?? null,
      shippingCity: input.city,
      shippingState: input.state,
      shippingPostal: input.postalCode,
      shippingCountry: input.country,
    };

    if (!PAYMENTS_ENABLED) {
      const orderNumber = await prisma.$transaction(async (tx) => {
        // Reserve stock now, conditionally: `stock >= quantity` makes the
        // database arbitrate between two concurrent buyers of the last unit,
        // the same guard the Stripe webhook uses after a real payment.
        for (const line of lines) {
          const reserved = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (reserved.count === 0) {
            throw new BadRequestException(
              `"${line.product.title}" only has ${line.product.stock} left in stock.`,
            );
          }
        }

        const created = await tx.order.create({
          data: {
            orderNumber: newOrderNumber(),
            cartId: cart.id,
            userId: userId ?? null,
            email: input.email.toLowerCase(),
            status: "PENDING",
            subtotalCents,
            shippingCents,
            taxCents: 0,
            totalCents,
            ...shippingFields,
            items: {
              create: lines.map((l) => ({
                productId: l.productId,
                titleSnapshot: l.product.title,
                unitPriceCents: l.product.priceCents,
                quantity: l.quantity,
              })),
            },
          },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        return created.orderNumber;
      });

      return { url: null, orderNumber };
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: newOrderNumber(),
        cartId: cart.id,
        userId: userId ?? null,
        email: input.email.toLowerCase(),
        status: "PENDING",
        subtotalCents,
        shippingCents,
        taxCents: 0,
        totalCents,
        ...shippingFields,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            titleSnapshot: l.product.title,
            unitPriceCents: l.product.priceCents,
            quantity: l.quantity,
          })),
        },
      },
    });

    const stripe = this.stripe.client();
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: order.email,
        client_reference_id: order.id,
        // The only link between a Stripe event and our row.
        metadata: { orderId: order.id },
        line_items: lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "usd",
            unit_amount: l.product.priceCents,
            product_data: {
              name: l.product.title,
              ...(l.product.imageUrl ? { images: [l.product.imageUrl] } : {}),
            },
          },
        })),
        shipping_options:
          shippingCents > 0
            ? [
                {
                  shipping_rate_data: {
                    type: "fixed_amount",
                    display_name: "Standard shipping",
                    fixed_amount: { amount: shippingCents, currency: "usd" },
                  },
                },
              ]
            : undefined,
        success_url: `${siteUrl}/checkout/success?order=${order.orderNumber}`,
        cancel_url: `${siteUrl}/cart`,
      });

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });
      return { url: session.url, orderNumber: order.orderNumber };
    } catch (err) {
      // Don't leave a PENDING order pointing at a session that never existed.
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      const message = err instanceof Error ? err.message : "Unknown Stripe error";
      throw new BadRequestException(`Could not start checkout: ${message}`);
    }
  }

  /**
   * An order, only if the caller is entitled. An order number is short and
   * guessable, so possession of it is not proof: entitlement means the caller
   * holds the guest-cart token the order was created from. Returns null both
   * when the order is missing and when the caller is not entitled, so the two
   * are indistinguishable from outside.
   */
  async getOwnedOrder(
    orderNumber: string,
    userId: string | undefined,
    cartToken: string | undefined,
  ): Promise<OrderDTO | null> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        totalCents: true,
        userId: true,
        cartId: true,
        carrier: true,
        trackingNumber: true,
        items: {
          select: {
            id: true,
            titleSnapshot: true,
            unitPriceCents: true,
            quantity: true,
          },
        },
      },
    });
    if (!order) return null;

    const toDTO = (): OrderDTO => ({
      orderNumber: order.orderNumber,
      status: order.status,
      totalCents: order.totalCents,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      items: order.items,
    });

    // A signed-in caller owns any order placed under their account — this
    // still works from a different device, or after the cart that created it
    // is long gone.
    if (userId && order.userId && order.userId === userId) return toDTO();

    // Otherwise, entitlement means holding the guest-cart token the order was
    // created from.
    if (order.cartId && cartToken) {
      const cart = await prisma.cart.findUnique({
        where: { guestToken: cartToken },
        select: { id: true },
      });
      if (cart && cart.id === order.cartId) return toDTO();
    }

    return null;
  }

  /**
   * Fulfil a paid Checkout Session — idempotent, with an oversell guard.
   * Stripe retries webhooks, and may deliver the same event more than once even
   * on success, so this must be safe to run twice concurrently.
   */
  async fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    // `payment_status` is what actually says money moved — a session can
    // "complete" without being paid (e.g. `no_payment_required` is the only
    // other value Stripe sends here, but never fulfil on faith).
    if (session.payment_status !== "paid") return;

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    let cartId: string | null = null;

    await prisma.$transaction(async (tx) => {
      // Atomic idempotency guard: `updateMany` with `status: "PENDING"` in the
      // WHERE clause either claims the row or matches nothing — there is no
      // window between reading and writing for a second concurrent delivery of
      // the same event to slip through. A `findUnique` then `update` would have
      // exactly that window and let two concurrent deliveries both proceed.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
        },
      });

      // Already processed by an earlier delivery of this event.
      if (claimed.count === 0) return;

      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { productId: true, quantity: true },
      });

      // Decrement conditionally: two buyers can both pass the checkout-time
      // stock check before either pays, and an unconditional decrement would
      // then oversell. `stock >= quantity` makes the database arbitrate.
      let short = false;
      for (const item of items) {
        if (!item.productId) continue;
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count === 0) short = true;
      }

      // The customer was already charged, so the order stays PAID. Flag it for a
      // human to refund or restock rather than silently overselling.
      if (short) {
        await tx.order.update({
          where: { id: orderId },
          data: { needsReview: true },
        });
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { cartId: true },
      });
      cartId = order?.cartId ?? null;
    });

    // The cart has served its purpose; empty it so the buyer starts clean.
    // Outside the transaction: it's cleanup, not part of the money-moving
    // invariant above, and a failure here must not roll back the payment record.
    if (cartId) {
      await prisma.cartItem.deleteMany({ where: { cartId } });
    }
  }

  /** Mark an order refunded. Idempotent: re-delivery just re-matches zero rows. */
  async markRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : (charge.payment_intent?.id ?? null);
    if (!paymentIntentId) return;

    await prisma.order.updateMany({
      where: { stripePaymentIntentId: paymentIntentId, status: { not: "REFUNDED" } },
      data: { status: "REFUNDED" },
    });
  }

  // --- Admin -----------------------------------------------------------------
  // Full detail, no ownership check — the caller already passed RolesGuard.

  async listAllOrders(): Promise<AdminOrderListItemDTO[]> {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    return orders.map(toAdminListItem);
  }

  async getOrderForAdmin(orderNumber: string): Promise<AdminOrderDTO> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          select: { id: true, titleSnapshot: true, unitPriceCents: true, quantity: true },
        },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return { ...toAdminListItem(order), items: order.items };
  }

  /**
   * Update an order's status. Internal bookkeeping only — this does not call
   * Stripe. Marking REFUNDED here does not move money; process the actual
   * refund in the Stripe dashboard (or a future admin action wired to Stripe's
   * Refunds API) and use this to record that it happened.
   */
  async updateOrderStatus(
    orderNumber: string,
    status: OrderStatusDTO,
    carrier?: string | null,
    trackingNumber?: string | null,
  ): Promise<AdminOrderDTO> {
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (!existing) throw new NotFoundException("Order not found");

    // `undefined` here means "not provided" and Prisma leaves the column
    // untouched; `null` explicitly clears it. Only meaningful when marking an
    // order SHIPPED, but harmless to accept alongside any other status.
    await prisma.order.update({
      where: { orderNumber },
      data: { status, carrier, trackingNumber },
    });
    return this.getOrderForAdmin(orderNumber);
  }

  /** A signed-in customer's own order history — no address, Stripe ids, or line items. */
  async listMyOrders(userId: string): Promise<MyOrderListItemDTO[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      totalCents: o.totalCents,
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  /** Count of orders placed but not yet paid — cheap enough for a nav badge. */
  async countPendingPayment(): Promise<number> {
    return prisma.order.count({ where: { status: "PENDING" } });
  }

  /**
   * Every figure here comes from real order/product rows. This app has no
   * visit or session tracking, so metrics like "visitors" or "conversion
   * rate" are deliberately not computed rather than faked.
   */
  async getDashboardSummary(): Promise<DashboardSummaryDTO> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (REVENUE_HISTORY_DAYS - 1));

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setUTCDate(twoWeeksAgo.getUTCDate() - 14);

    const [
      salesAgg,
      totalOrders,
      ordersNeedingReview,
      pendingPaymentCount,
      thisWeekAgg,
      priorWeekAgg,
      statusGroups,
      customerEmails,
      recentOrders,
      ordersInRange,
      lineItems,
      lowStockProducts,
    ] = await Promise.all([
        prisma.order.aggregate({
          where: { status: { in: REVENUE_STATUSES } },
          _sum: { totalCents: true },
          _count: true,
        }),
        prisma.order.count({
          where: { status: { in: [...REVENUE_STATUSES, "REFUNDED"] } },
        }),
        prisma.order.count({ where: { needsReview: true } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        // Week-over-week comparison: this metric is meaningless without a
        // baseline (a bare "$X in sales" doesn't say whether that's growth or
        // decline), so both windows are fetched to compute a % change.
        prisma.order.aggregate({
          where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: weekAgo, lt: now } },
          _sum: { totalCents: true },
          _count: true,
        }),
        prisma.order.aggregate({
          where: {
            status: { in: REVENUE_STATUSES },
            createdAt: { gte: twoWeeksAgo, lt: weekAgo },
          },
          _sum: { totalCents: true },
          _count: true,
        }),
        prisma.order.groupBy({ by: ["status"], _count: true }),
        prisma.order.findMany({
          where: { status: { in: REVENUE_STATUSES } },
          select: { email: true },
        }),
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.order.findMany({
          where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since } },
          select: { totalCents: true, createdAt: true },
        }),
        prisma.orderItem.findMany({
          where: { order: { status: { in: REVENUE_STATUSES } } },
          select: {
            unitPriceCents: true,
            quantity: true,
            product: { select: { category: { select: { name: true } } } },
          },
        }),
        prisma.product.findMany({
          where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } },
          orderBy: { stock: "asc" },
          take: 5,
          select: { slug: true, title: true, stock: true },
        }),
      ]);

    const totalSalesCents = salesAgg._sum.totalCents ?? 0;
    const revenueOrderCount = salesAgg._count;
    const avgOrderValueCents =
      revenueOrderCount > 0 ? Math.round(totalSalesCents / revenueOrderCount) : 0;

    // A % change against a zero-order prior window is undefined, not "∞%" —
    // surfaced as null so the UI can say "no prior data" instead of a bogus
    // number.
    const pctChange = (current: number, prior: number): number | null =>
      prior === 0 ? null : Math.round(((current - prior) / prior) * 1000) / 10;
    const salesChangePct = pctChange(
      thisWeekAgg._sum.totalCents ?? 0,
      priorWeekAgg._sum.totalCents ?? 0,
    );
    const ordersChangePct = pctChange(thisWeekAgg._count, priorWeekAgg._count);

    const statusCounts = new Map(statusGroups.map((g) => [g.status, g._count]));
    const statusBreakdown = ORDER_STATUSES.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    }));

    const emailOrderCounts = new Map<string, number>();
    for (const { email } of customerEmails) {
      emailOrderCounts.set(email, (emailOrderCounts.get(email) ?? 0) + 1);
    }
    let newCustomerCount = 0;
    let returningCustomerCount = 0;
    for (const count of emailOrderCounts.values()) {
      if (count > 1) returningCustomerCount++;
      else newCustomerCount++;
    }

    const byDay = new Map<string, number>();
    for (let i = 0; i < REVENUE_HISTORY_DAYS; i++) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const order of ordersInRange) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + order.totalCents);
    }
    const revenueByDay = [...byDay.entries()].map(([date, totalCents]) => ({
      date,
      totalCents,
    }));

    const categoryTotals = new Map<string, number>();
    for (const item of lineItems) {
      const name = item.product?.category?.name ?? "Uncategorized";
      const lineTotal = item.unitPriceCents * item.quantity;
      categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + lineTotal);
    }
    const topCategories = [...categoryTotals.entries()]
      .map(([name, totalCents]) => ({ name, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 5);

    return {
      totalSalesCents,
      totalOrders,
      avgOrderValueCents,
      salesChangePct,
      ordersChangePct,
      newCustomerCount,
      returningCustomerCount,
      ordersNeedingReview,
      pendingPaymentCount,
      statusBreakdown,
      revenueByDay,
      topCategories,
      lowStockProducts,
      recentOrders: recentOrders.map(toAdminListItem),
    };
  }
}

function toAdminListItem(order: {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatusDTO;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  needsReview: boolean;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminOrderListItemDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    status: order.status,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    needsReview: order.needsReview,
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingPostal: order.shippingPostal,
    shippingCountry: order.shippingCountry,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    stripeSessionId: order.stripeSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

