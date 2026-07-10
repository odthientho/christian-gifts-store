import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;

  const order = orderNumber
    ? await db.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-emerald-500/15 text-2xl text-emerald-600">
        ✓
      </div>

      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Thank you
      </h1>
      <p className="mt-2 text-muted-foreground">
        Your order has been received. A receipt is on its way to your inbox.
      </p>

      {order ? (
        <div className="mt-8 rounded-lg border p-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="font-mono">{order.orderNumber}</span>
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.titleSnapshot}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                <span className="tabular-nums">
                  {formatCents(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCents(order.totalCents)}</span>
          </div>

          {order.status === "PENDING" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Payment is still being confirmed. This page updates once Stripe
              notifies us — it does not affect your order.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          We could not find that order number.
        </p>
      )}

      <Link href="/" className={cn(buttonVariants(), "mt-8")}>
        Continue shopping
      </Link>
    </div>
  );
}
