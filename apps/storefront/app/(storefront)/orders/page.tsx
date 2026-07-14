import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/orders";
import { formatCents } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Order history is per-person and changes as new orders come in — never cache
// or index it.
export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  await requireUser("/orders");
  const [orders, dict] = await Promise.all([getMyOrders(), getDictionary()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {dict.myOrders.title}
      </h1>

      {orders.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">{dict.myOrders.empty}</p>
          <Link href="/books" className={cn(buttonVariants(), "mt-6")}>
            {dict.myOrders.browse}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {orders.map((o) => (
            <li
              key={o.orderNumber}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-mono text-sm">{o.orderNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                  {o.itemCount} {o.itemCount === 1 ? dict.myOrders.item : dict.myOrders.items}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium">
                  {o.status}
                </span>
                <span className="tabular-nums font-medium">
                  {formatCents(o.totalCents)}
                </span>
                <Link
                  href={`/checkout/success?order=${encodeURIComponent(o.orderNumber)}`}
                  className="text-sm text-primary hover:underline"
                >
                  {dict.myOrders.view}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
