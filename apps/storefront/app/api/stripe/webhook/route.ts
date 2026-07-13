import type Stripe from "stripe";

import { db } from "@/lib/db";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

// Stripe signs the exact bytes it sent. Next.js gives us the untouched body via
// `req.text()` — parsing to JSON first and re-serializing would change the bytes
// and every signature check would fail.

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    // Async variant: uses SubtleCrypto, and works on every runtime.
    event = await getStripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (err) {
    // An unverified body is attacker-controlled. Nothing below may run.
    const message = err instanceof Error ? err.message : "unknown";
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await fulfillOrder(event.data.object);
        break;
      case "charge.refunded":
        await markRefunded(event.data.object);
        break;
      default:
        // Unhandled events are fine; acknowledge so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // A 500 tells Stripe to retry. Only return it for genuinely transient
    // failures — the handler below is safe to run twice.
    const message = err instanceof Error ? err.message : "unknown";
    return new Response(`Handler error: ${message}`, { status: 500 });
  }

  return Response.json({ received: true });
}

/**
 * Mark an order paid and decrement stock, exactly once.
 *
 * Stripe retries on any non-2xx and may deliver the same event twice even on
 * success. The `status: "PENDING"` guard inside the transaction is what makes
 * this idempotent: the second delivery updates zero rows, so stock is never
 * decremented twice.
 */
async function fulfillOrder(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  // `payment_status` is what actually says money moved.
  if (session.payment_status !== "paid") return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
        ...addressFrom(session),
      },
    });

    // Already processed by an earlier delivery of this event.
    if (claimed.count === 0) return;

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });

    // Decrement conditionally. Checkout verified stock before redirecting to
    // Stripe, but two buyers can both pass that check before either pays, and
    // an unconditional `decrement` would then drive stock negative and oversell.
    //
    // `WHERE stock >= quantity` makes the database arbitrate: the UPDATE either
    // matches a row and decrements it atomically, or matches nothing. Whoever
    // loses the race gets count === 0.
    let short = false;
    for (const item of items) {
      if (!item.productId) continue;
      const reserved = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (reserved.count === 0) short = true;
    }

    // The customer has already been charged, so the order stays PAID. Flag it
    // instead: a human must refund or restock. Silently absorbing this would
    // mean taking money for goods that do not exist.
    if (short) {
      await tx.order.update({
        where: { id: orderId },
        data: { needsReview: true },
      });
    }

    // The cart has served its purpose; empty it so the buyer starts clean.
    // Recorded on the order at checkout, so this works for guests too.
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { cartId: true },
    });
    if (order?.cartId) {
      await tx.cartItem.deleteMany({ where: { cartId: order.cartId } });
    }
  });
}

function addressFrom(session: Stripe.Checkout.Session) {
  const details = session.customer_details;
  const address = details?.address;
  if (!address) return {};
  return {
    shippingName: details?.name ?? null,
    shippingLine1: address.line1 ?? null,
    shippingLine2: address.line2 ?? null,
    shippingCity: address.city ?? null,
    shippingState: address.state ?? null,
    shippingPostal: address.postal_code ?? null,
    shippingCountry: address.country ?? null,
  };
}

async function markRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);
  if (!paymentIntentId) return;

  await db.order.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { not: "REFUNDED" } },
    data: { status: "REFUNDED" },
  });
}
