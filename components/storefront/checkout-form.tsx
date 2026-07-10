"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCheckoutSessionAction } from "@/server/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CheckoutForm({
  defaultEmail,
  stripeReady,
}: {
  defaultEmail?: string;
  stripeReady: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [pending, startTransition] = useTransition();

  function checkout() {
    startTransition(async () => {
      // Only an email crosses the wire. Totals are recomputed server-side.
      const result = await createCheckoutSessionAction({ email });
      if (result.ok) {
        window.location.href = result.url;
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email for your receipt</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={pending || !email}
        onClick={checkout}
      >
        {pending ? "Redirecting…" : "Checkout"}
      </Button>

      {!stripeReady && (
        <p className="text-xs text-amber-600">
          Stripe keys are not configured. Add <code>STRIPE_SECRET_KEY</code> to{" "}
          <code>.env</code> to enable payment.
        </p>
      )}
    </div>
  );
}
