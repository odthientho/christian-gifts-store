"use server";

import { cookies } from "next/headers";

import { apiCheckout } from "@/lib/api-client";
import { CART_COOKIE } from "@/lib/cart-cookie";
import { checkoutSchema } from "@/lib/validations/cart";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Start checkout via the API. The storefront sends only an email and the cart
 * token; the API reads the cart, recomputes every total from database prices,
 * creates the PENDING order, and returns a Stripe Checkout URL. Rate limiting,
 * the Stripe-configured check, and the stock re-check all live at the API now.
 */
export async function createCheckoutSessionAction(input: {
  email: string;
}): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return { ok: false, error: "Your cart is empty." };

  const result = await apiCheckout(parsed.data.email, token);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, url: result.data.url };
}
