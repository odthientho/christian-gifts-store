import { cookies } from "next/headers";

import { apiGetOrder } from "@/lib/api-client";
import { CART_COOKIE } from "@/lib/cart-cookie";

/**
 * Load an order only if the caller is entitled to see it.
 *
 * Entitlement is decided by the API: an order number is short and guessable, so
 * it is never enough on its own. The storefront forwards the caller's guest-cart
 * token and the API returns the order only when that token matches the cart the
 * order was created from — otherwise null, indistinguishable from "not found".
 */
export async function getOwnedOrder(orderNumber: string) {
  const cartToken = (await cookies()).get(CART_COOKIE)?.value;
  return apiGetOrder(orderNumber, cartToken);
}
