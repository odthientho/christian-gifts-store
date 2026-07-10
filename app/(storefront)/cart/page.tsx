import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";

import { getCart, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { formatCents } from "@/lib/money";
import { CartLines } from "@/components/storefront/cart-lines";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);
  const stripeReady = isStripeConfigured();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-28 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
          <ShoppingBag
            className="size-6 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse the shelves and find something worth keeping.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/books" className={buttonVariants()}>
            Browse books
          </Link>
          <Link
            href="/gifts"
            className={buttonVariants({ variant: "outline" })}
          >
            Browse gifts
          </Link>
        </div>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;
  const progress = Math.min(
    100,
    Math.round((cart.subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Your cart
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div className="rounded-xl border bg-card px-5">
          <CartLines lines={cart.lines} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">
              Order summary
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatCents(cart.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {cart.shippingCents === 0 ? (
                    <span className="font-medium text-emerald-600">Free</span>
                  ) : (
                    formatCents(cart.shippingCents)
                  )}
                </dd>
              </div>
            </dl>

            {remaining > 0 ? (
              <div className="mt-5 rounded-lg bg-muted/70 p-3.5">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-3.5 shrink-0" strokeWidth={1.75} />
                  Add{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCents(remaining)}
                  </span>{" "}
                  more for free shipping
                </p>
                <div
                  className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress toward free shipping"
                >
                  <div
                    className="h-full rounded-full bg-brass transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3.5 text-xs text-emerald-700">
                <Truck className="size-3.5 shrink-0" strokeWidth={1.75} />
                Your order ships free.
              </p>
            )}

            <Separator className="my-6" />

            <div className="flex items-baseline justify-between">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatCents(cart.totalCents)}
              </span>
            </div>

            <div className="mt-6">
              <CheckoutForm
                defaultEmail={user?.email}
                stripeReady={stripeReady}
              />
            </div>
          </div>

          <Link
            href="/books"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mt-3 w-full text-muted-foreground",
            )}
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
