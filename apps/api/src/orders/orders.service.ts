import { Injectable, BadRequestException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { prisma } from "@gin/db";
import { shippingForSubtotal, type OrderDTO } from "@gin/contracts";

import { StripeService } from "./stripe.service.js";

function newOrderNumber(): string {
  return `GIN-${randomBytes(4).toString("hex").toUpperCase()}`;
}

@Injectable()
export class OrdersService {
  constructor(private readonly stripe: StripeService) {}

  /**
   * Turn a cart (by token) into a PENDING order and a Stripe Checkout Session.
   * Line items and every total are read from the database — a price that arrived
   * over the wire is never used. The order is written before Stripe is called so
   * the webhook always has a row to reconcile against.
   */
  async createCheckout(
    email: string,
    cartToken: string,
    siteUrl: string,
  ): Promise<{ url: string }> {
    if (!this.stripe.isConfigured()) {
      throw new BadRequestException(
        "Payments are not configured. Add STRIPE_SECRET_KEY to enable checkout.",
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { guestToken: cartToken },
      include: { items: { include: { product: true } } },
    });
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

    const order = await prisma.order.create({
      data: {
        orderNumber: newOrderNumber(),
        cartId: cart.id,
        email: email.toLowerCase(),
        status: "PENDING",
        subtotalCents,
        shippingCents,
        taxCents: 0,
        totalCents,
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
      return { url: session.url };
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
    cartToken: string | undefined,
  ): Promise<OrderDTO | null> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        totalCents: true,
        cartId: true,
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

    if (order.cartId && cartToken) {
      const cart = await prisma.cart.findUnique({
        where: { guestToken: cartToken },
        select: { id: true },
      });
      if (cart && cart.id === order.cartId) {
        return {
          orderNumber: order.orderNumber,
          status: order.status,
          totalCents: order.totalCents,
          items: order.items,
        };
      }
    }
    return null;
  }

  /**
   * Fulfil a paid Checkout Session — idempotent, with an oversell guard.
   * Stripe retries webhooks, so a second delivery of the same event must be a
   * no-op; the unique stripeSessionId makes the PAID transition happen once.
   */
  async fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== "PENDING") return; // already handled

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        },
      });

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
    });
  }
}
