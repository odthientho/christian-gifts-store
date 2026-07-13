import Stripe from "stripe";

// Lazily constructed so that the storefront still renders on a machine that has
// not configured Stripe keys yet. Only checkout and the webhook need Stripe, and
// those fail loudly rather than the whole app failing at import time.

let cached: Stripe | undefined;

export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env to enable checkout.",
    );
  }

  // No explicit apiVersion: the installed SDK pins the version it was built
  // against. Pinning a different string here only invites drift.
  cached = new Stripe(key);
  return cached;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.",
    );
  }
  return secret;
}

/** True when Stripe is configured; lets the UI show a helpful notice instead of crashing. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
