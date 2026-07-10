"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Lock, TriangleAlert } from "lucide-react";

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
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs text-muted-foreground">
          Email for your receipt
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10"
        />
      </div>

      <Button
        className="h-11 w-full gap-2 text-sm"
        disabled={pending || !email}
        onClick={checkout}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            <Lock className="size-3.5" strokeWidth={2} />
            Checkout
          </>
        )}
      </Button>

      {stripeReady ? (
        <p className="text-center text-xs text-muted-foreground">
          Secure payment by Stripe. Cards never touch our server.
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-brass/15 p-3 text-xs text-brass-foreground">
          <TriangleAlert className="mt-px size-3.5 shrink-0" strokeWidth={2} />
          <span>
            Payments are not configured. Add <code>STRIPE_SECRET_KEY</code> to{" "}
            <code>.env</code> to enable checkout.
          </span>
        </p>
      )}
    </div>
  );
}
