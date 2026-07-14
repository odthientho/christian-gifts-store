"use server";

import { cookies, headers } from "next/headers";
import { checkoutSchema, type CheckoutInput } from "@gin/contracts";

import { apiCheckout } from "@/lib/api-client";
import { CART_COOKIE } from "@/lib/cart-cookie";
import { clientIp } from "@/lib/rate-limit";
import { getSessionToken } from "@/lib/session";

export type CheckoutResult =
  | { ok: true; url: string; orderNumber: string }
  | { ok: false; error: string };

export type CheckoutFormInput = Omit<CheckoutInput, "cartToken">;

/**
 * Start checkout via the API. The storefront sends the shipping/contact
 * details plus an identity (session token if signed in, else the guest cart
 * token); the API reads the matching cart, recomputes every total from
 * database prices, and creates the order. With online payment enabled, it
 * returns a Stripe Checkout URL; otherwise the order is placed directly and
 * `url` comes back null — the caller should route straight to the
 * confirmation page.
 *
 * Rate limiting also lives at the API's @Throttle on POST /checkout, keyed on
 * the visitor's real IP — forwarded here, since every storefront->API request
 * otherwise arrives from this server's single IP.
 */
export async function createCheckoutSessionAction(
  input: CheckoutFormInput,
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.omit({ cartToken: true }).safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Check the form and try again." };
  }

  const [sessionToken, cartToken, ip] = await Promise.all([
    getSessionToken(),
    cookies().then((jar) => jar.get(CART_COOKIE)?.value),
    headers().then(clientIp),
  ]);
  if (!sessionToken && !cartToken) {
    return { ok: false, error: "Your cart is empty." };
  }

  const result = await apiCheckout(parsed.data, cartToken, ip, sessionToken);
  if (!result.ok) return { ok: false, error: result.error };
  if (result.data.url) {
    return { ok: true, url: result.data.url, orderNumber: result.data.orderNumber };
  }
  // Payments disabled: no external redirect, go straight to confirmation.
  return {
    ok: true,
    url: `/checkout/success?order=${encodeURIComponent(result.data.orderNumber)}`,
    orderNumber: result.data.orderNumber,
  };
}
