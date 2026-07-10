import type { Metadata } from "next";

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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">
          No orders yet. They appear here once a checkout completes.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
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
                    <span className="block">{o.email}</span>
                    {o.shippingCity && (
                      <span className="text-xs text-muted-foreground">
                        {o.shippingCity}, {o.shippingCountry}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCents(o.totalCents)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
