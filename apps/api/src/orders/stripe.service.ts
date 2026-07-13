import { Injectable } from "@nestjs/common";
import Stripe from "stripe";

// Lazily constructed so the API boots without Stripe keys; only checkout and the
// webhook need Stripe, and they fail loudly rather than at startup.

@Injectable()
export class StripeService {
  private cached: Stripe | undefined;

  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  client(): Stripe {
    if (this.cached) return this.cached;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    this.cached = new Stripe(key);
    return this.cached;
  }

  webhookSecret(): string {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
    return secret;
  }
}
