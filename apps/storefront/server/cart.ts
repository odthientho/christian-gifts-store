"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiAddToCart, apiUpdateCartItem } from "@/lib/api-client";
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from "@/lib/cart-cookie";
import { getSessionToken } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

// These actions proxy the API. Signed in, the cart is identified by the
// session token and the API resolves it by userId — no cookie needed. Signed
// out, the storefront holds an opaque guest cart token in an httpOnly cookie.
// Either way the API owns cart state and recomputes every total; the client
// sends nothing but a product id and a quantity.

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
  const [sessionToken, cartToken] = await Promise.all([
    getSessionToken(),
    cookies().then((jar) => jar.get(CART_COOKIE)?.value),
  ]);

  const result = await apiAddToCart(
    sessionToken,
    cartToken,
    input.productId,
    input.quantity,
  );
  if (!result.ok) return { ok: false, error: result.error };

  // Only a guest cart carries a client-visible token to persist. A signed-in
  // cart's identity is the session itself — the API returns token: null.
  if (result.data.token && result.data.token !== cartToken) {
    await persistToken(result.data.token);
  }

  revalidatePath("/cart");
  return { ok: true };
}

export async function updateCartItemAction(input: {
  productId: string;
  quantity: number;
}): Promise<ActionResult> {
  const [sessionToken, cartToken] = await Promise.all([
    getSessionToken(),
    cookies().then((jar) => jar.get(CART_COOKIE)?.value),
  ]);
  if (!sessionToken && !cartToken) {
    return { ok: false, error: "Your cart is empty." };
  }

  const result = await apiUpdateCartItem(
    sessionToken,
    cartToken,
    input.productId,
    input.quantity,
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/cart");
  return { ok: true };
}
