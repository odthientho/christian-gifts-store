"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiAddToCart, apiUpdateCartItem } from "@/lib/api-client";
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from "@/lib/cart-cookie";

export type ActionResult = { ok: true } | { ok: false; error: string };

// These actions proxy the API. The storefront holds only the opaque cart token
// in an httpOnly cookie; the API owns cart state and recomputes every total.
// The client still sends nothing but a product id and a quantity.

async function persistToken(token: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function addToCartAction(input: {
  productId: string;
  quantity: number;
}): Promise<ActionResult> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  const result = await apiAddToCart(token, input.productId, input.quantity);
  if (!result.ok) return { ok: false, error: result.error };

  // The API mints a token on the first add; store it so later requests reuse
  // the same cart.
  if (result.data.token && result.data.token !== token) {
    await persistToken(result.data.token);
  }

  revalidatePath("/cart");
  return { ok: true };
}

export async function updateCartItemAction(input: {
  productId: string;
  quantity: number;
}): Promise<ActionResult> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return { ok: false, error: "Your cart is empty." };

  const result = await apiUpdateCartItem(token, input.productId, input.quantity);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/cart");
  return { ok: true };
}
