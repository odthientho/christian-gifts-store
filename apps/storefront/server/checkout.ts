"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCart, shippingForSubtotal } from "@/lib/cart";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations/cart";
import { clientIp, rateLimit, LIMITS } from "@/lib/rate-limit";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function newOrderNumber(): string {
  // Short, unambiguous, and not a guessable sequence.
  return `CGS-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Turn the current cart into a PENDING order and a Stripe Checkout Session.
 *
 * The client sends an email address and nothing else. Line items, quantities
 * and every total are read back out of the database here; a price that arrived
 * over the wire is never used. The order is written before Stripe is called so
 * the webhook always has a row to reconcile against.
 */
export async function createCheckoutSessionAction(input: {
  email: string;
}): Promise<CheckoutResult> {
  // Each call writes an order row and creates a Stripe session. Unthrottled,
  // this is a cheap way for a script to fill the orders table.
  const ip = clientIp(await headers());
  const throttled = rateLimit(
    `checkout:${ip}`,
    LIMITS.checkout.limit,
    LIMITS.checkout.windowMs,
  );
  if (!throttled.ok) {
    return { ok: false, error: "Too many checkout attempts. Try again shortly." };
  }

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        "Payments are not configured. Add STRIPE_SECRET_KEY to .env to enable checkout.",
    };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const user = await getCurrentUser();
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  // Re-check stock at the moment of purchase, not at the moment of adding.
  for (const line of cart.lines) {
    if (line.quantity > line.stock) {
      return {
        ok: false,
        error: `"${line.title}" only has ${line.stock} left in stock.`,
      };
    }
  }

  // Recomputed from database prices via getCart(), which reads product.priceCents.
  const subtotalCents = cart.subtotalCents;
  const shippingCents = shippingForSubtotal(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  const order = await db.order.create({
    data: {
      orderNumber: newOrderNumber(),
      userId: user?.id ?? null,
      cartId: cart.id,
      email: parsed.data.email.toLowerCase(),
      status: "PENDING",
      subtotalCents,
      shippingCents,
      taxCents: 0,
      totalCents,
      items: {
        create: cart.lines.map((line) => ({
          productId: line.productId,
          titleSnapshot: line.title,
          unitPriceCents: line.unitPriceCents,
          quantity: line.quantity,
        })),
      },
    },
  });

  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      client_reference_id: order.id,
      // The webhook reads this back to find the order. It is the only link
      // between a Stripe event and our database row.
      metadata: { orderId: order.id },
      line_items: cart.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "usd",
          unit_amount: line.unitPriceCents,
          product_data: {
            name: line.title,
            ...(line.imageUrl ? { images: [line.imageUrl] } : {}),
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
      success_url: `${siteUrl()}/checkout/success?order=${order.orderNumber}`,
      cancel_url: `${siteUrl()}/cart`,
    });

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }

    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return { ok: true, url: session.url };
  } catch (err) {
    // Don't leave a PENDING order pointing at a session that never existed.
    await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return { ok: false, error: `Could not start checkout: ${message}` };
  }
}
