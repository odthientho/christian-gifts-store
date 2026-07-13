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

// Cart state now lives behind the API. The storefront only holds the opaque
// cart token (in an httpOnly cookie) and asks the API to compute the cart.

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
  const token = (await cookies()).get(CART_COOKIE)?.value;
  const cart = await apiGetCart(token);
  return cart ?? EMPTY_CART;
}

/** Item count for the header badge. */
export async function getCartCount(): Promise<number> {
  return (await getCart()).itemCount;
}
