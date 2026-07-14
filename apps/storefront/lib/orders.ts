import { cookies } from "next/headers";

import { apiGetOrder } from "@/lib/api-client";
import { CART_COOKIE } from "@/lib/cart-cookie";
import { getSessionToken } from "@/lib/session";

/**
 * Load an order only if the caller is entitled to see it.
 *
 * Entitlement is decided by the API: an order number is short and guessable,
 * so it is never enough on its own. A signed-in caller owns any order placed
 * under their account, from any device; a guest is entitled only via the
 * cart token the order was created from. The API returns null for both
 * "missing" and "not yours" — indistinguishable from outside.
 */
export async function getOwnedOrder(orderNumber: string) {
  const [sessionToken, cartToken] = await Promise.all([
    getSessionToken(),
    cookies().then((jar) => jar.get(CART_COOKIE)?.value),
  ]);
  return apiGetOrder(orderNumber, sessionToken, cartToken);
}
