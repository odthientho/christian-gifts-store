import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";

import { getCart, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { getDictionary, interpolate } from "@/lib/i18n";
import { CartLines } from "@/components/storefront/cart-lines";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.nav.cartLabel };
}

export default async function CartPage() {
  const [cart, user, dict] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getDictionary(),
  ]);
  // The API owns payment config now. Always offer checkout; if the API has no
  // Stripe keys it returns a clear error the form surfaces on click.
  const stripeReady = true;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-28 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent">
          <ShoppingBag className="size-6 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
          {dict.cart.empty}
        </h1>
        <p className="mt-2 text-muted-foreground">{dict.cart.emptySub}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/books" className={buttonVariants()}>
            {dict.home.browseBooks}
          </Link>
          <Link
            href="/gifts"
            className={buttonVariants({ variant: "outline" })}
          >
            {dict.home.browseGifts}
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
  const noun = cart.itemCount === 1 ? dict.cart.item : dict.cart.items;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.cart.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {cart.itemCount} {noun}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div className="rounded-xl border bg-card px-5">
          <CartLines lines={cart.lines} removeLabel={dict.cart.remove} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">
              {dict.cart.summary}
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{dict.cart.subtotal}</dt>
                <dd className="tabular-nums">
                  {formatCents(cart.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{dict.cart.shipping}</dt>
                <dd className="tabular-nums">
                  {cart.shippingCents === 0 ? (
                    <span className="font-medium text-emerald-600">
                      {dict.cart.free}
                    </span>
                  ) : (
                    formatCents(cart.shippingCents)
                  )}
                </dd>
              </div>
            </dl>

            {remaining > 0 ? (
              <div className="mt-5 rounded-lg bg-accent p-3.5">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {interpolate(dict.cart.addMore, {
                    amount: formatCents(remaining),
                  })}
                </p>
                <div
                  className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Free shipping progress"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3.5 text-xs text-emerald-700">
                <Truck className="size-3.5 shrink-0" strokeWidth={1.75} />
                {dict.cart.shipsFree}
              </p>
            )}

            <Separator className="my-6" />

            <div className="flex items-baseline justify-between">
              <span className="font-medium">{dict.cart.total}</span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatCents(cart.totalCents)}
              </span>
            </div>

            <div className="mt-6">
              <CheckoutForm
                defaultEmail={user?.email}
                stripeReady={stripeReady}
                labels={{
                  emailLabel: dict.cart.emailLabel,
                  checkout: dict.cart.checkout,
                  redirecting: dict.cart.redirecting,
                  securePayment: dict.cart.securePayment,
                  notConfigured: dict.cart.notConfigured,
                }}
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
            {dict.cart.continue}
          </Link>
        </aside>
      </div>
    </div>
  );
}
