import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CART_COOKIE } from "@/lib/cart";

/**
 * Load an order only if the caller is entitled to see it.
 *
 * An order number is short and therefore guessable, so it cannot be the only
 * thing standing between a stranger and someone else's purchase. Entitlement is
 * one of:
 *
 *   - the order belongs to the signed-in user, or
 *   - the caller still holds the httpOnly guest-cart cookie whose cart the
 *     order was created from (a 24-byte random token).
 *
 * Returns null when the order does not exist *and* when the caller is not
 * entitled, so the two cases are indistinguishable from outside.
 */
export async function getOwnedOrder(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      userId: true,
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

  const user = await getCurrentUser();
  if (user && order.userId && order.userId === user.id) return order;

  if (order.cartId) {
    const jar = await cookies();
    const guestToken = jar.get(CART_COOKIE)?.value;
    if (guestToken) {
      const cart = await db.cart.findUnique({
        where: { guestToken },
        select: { id: true },
      });
      if (cart && cart.id === order.cartId) return order;
    }
  }

  return null;
}
