import { cookies } from "next/headers";

import {
  EMPTY_CART,
  FREE_SHIPPING_THRESHOLD_CENTS,
  FLAT_SHIPPING_CENTS,
  shippingForSubtotal,
  type CartViewDTO,
  type CartLineDTO,
} from "@gin/contracts";
import { apiGetCart } from "@/lib/api-client";
import { CART_COOKIE } from "@/lib/cart-cookie";
import { getSessionToken } from "@/lib/session";

// Cart state lives behind the API. Signed in, the cart is identified by the
// session token (the API resolves it by userId); signed out, by the opaque
// guest token in an httpOnly cookie. Sending both is harmless — the API always
// prefers the session.

export {
  CART_COOKIE,
  FREE_SHIPPING_THRESHOLD_CENTS,
  FLAT_SHIPPING_CENTS,
  shippingForSubtotal,
};
export type CartView = CartViewDTO;
export type CartLine = CartLineDTO;

/** The current cart, or an empty one. Read-only — never mints a token. */
export async function getCart(): Promise<CartView> {
  const [sessionToken, cartToken] = await Promise.all([
    getSessionToken(),
    cookies().then((jar) => jar.get(CART_COOKIE)?.value),
  ]);
  const cart = await apiGetCart(sessionToken, cartToken);
  return cart ?? EMPTY_CART;
}

/** Item count for the header badge. */
export async function getCartCount(): Promise<number> {
  return (await getCart()).itemCount;
}
