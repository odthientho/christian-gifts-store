"use server";

import { cookies, headers } from "next/headers";

import { apiCheckout } from "@/lib/api-client";
import { CART_COOKIE } from "@/lib/cart-cookie";
import { checkoutSchema } from "@/lib/validations/cart";
import { clientIp } from "@/lib/rate-limit";
import { getSessionToken } from "@/lib/session";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Start checkout via the API. The storefront sends only an email and an
 * identity (session token if signed in, else the guest cart token); the API
 * reads the matching cart, recomputes every total from database prices,
 * creates the PENDING order, and returns a Stripe Checkout URL. The
 * Stripe-configured check and the stock re-check live at the API.
 *
 * Rate limiting also lives at the API's @Throttle on POST /checkout, keyed on
 * the visitor's real IP — forwarded here, since every storefront->API request
 * otherwise arrives from this server's single IP.
 */
export async function createCheckoutSessionAction(input: {
  email: string;
}): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const [sessionToken, cartToken, ip] = await Promise.all([
    getSessionToken(),
    cookies().then((jar) => jar.get(CART_COOKIE)?.value),
    headers().then(clientIp),
  ]);
  if (!sessionToken && !cartToken) {
    return { ok: false, error: "Your cart is empty." };
  }

  const result = await apiCheckout(parsed.data.email, cartToken, ip, sessionToken);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, url: result.data.url };
}
