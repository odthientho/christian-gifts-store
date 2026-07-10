import type { Metadata } from "next";
import Link from "next/link";

import { getCart, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { formatCents } from "@/lib/money";
import { CartLines } from "@/components/storefront/cart-lines";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);
  const stripeReady = isStripeConfigured();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse the shelves and find something worth keeping.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/books" className={buttonVariants()}>
            Browse books
          </Link>
          <Link href="/gifts" className={buttonVariants({ variant: "outline" })}>
            Browse gifts
          </Link>
        </div>
      </div>
    );
  }

  const remainingForFreeShipping =
    FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Your cart</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <CartLines lines={cart.lines} />

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatCents(cart.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {cart.shippingCents === 0
                    ? "Free"
                    : formatCents(cart.shippingCents)}
                </dd>
              </div>
            </dl>

            {remainingForFreeShipping > 0 && (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Add {formatCents(remainingForFreeShipping)} more for free
                shipping.
              </p>
            )}

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCents(cart.totalCents)}
              </span>
            </div>

            <CheckoutForm
              defaultEmail={user?.email}
              stripeReady={stripeReady}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
