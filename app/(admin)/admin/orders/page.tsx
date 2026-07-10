import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {orders.length === 0
            ? "Nothing yet"
            : `Showing the ${orders.length} most recent`}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
            <Receipt
              className="size-5 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <p className="mt-4 text-muted-foreground">No orders yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            They appear here once a checkout completes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    {o.orderNumber}
                  </TableCell>

                  <TableCell>
                    <span className="block text-sm">{o.email}</span>
                    {o.shippingCity && (
                      <span className="text-xs text-muted-foreground">
                        {o.shippingCity}, {o.shippingCountry}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                  </TableCell>

                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCents(o.totalCents)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {o.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell>
                    <OrderStatusSelect orderId={o.id} status={o.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
