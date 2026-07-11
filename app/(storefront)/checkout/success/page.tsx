import type { Metadata } from "next";
import Link from "next/link";

import { getOwnedOrder } from "@/lib/orders";
import { formatCents } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// This page renders a specific person's purchase and the order number travels
// in the URL, so keep it out of caches and out of search indexes.
export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ order: orderNumber }, dict] = await Promise.all([
    searchParams,
    getDictionary(),
  ]);

  // An order number alone is not proof of ownership. getOwnedOrder returns null
  // unless the caller owns the order or holds the guest-cart cookie it came
  // from — so a guessed order number looks exactly like a nonexistent one.
  const order = orderNumber ? await getOwnedOrder(orderNumber) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-emerald-500/15 text-2xl text-emerald-600">
        ✓
      </div>

      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {dict.success.thankYou}
      </h1>
      <p className="mt-2 text-muted-foreground">{dict.success.received}</p>

      {order ? (
        <div className="mt-8 rounded-lg border p-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{dict.success.order}</span>
            <span className="font-mono">{order.orderNumber}</span>
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.titleSnapshot}
                  <span className="text-muted-foreground">
                    {" "}
                    × {item.quantity}
                  </span>
                </span>
                <span className="tabular-nums">
                  {formatCents(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
            <span>{dict.success.total}</span>
            <span className="tabular-nums">{formatCents(order.totalCents)}</span>
          </div>

          {order.status === "PENDING" && (
            <p className="mt-4 text-xs text-muted-foreground">
              {dict.success.pending}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          {dict.success.notFound}
        </p>
      )}

      <Link href="/" className={cn(buttonVariants(), "mt-8")}>
        {dict.success.continue}
      </Link>
    </div>
  );
}
