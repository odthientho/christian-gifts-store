import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdmin();

  const [productCount, orderCount, paidAgg, lowStock, recentOrders] =
    await Promise.all([
      db.product.count({ where: { active: true } }),
      db.order.count(),
      db.order.aggregate({
        where: { status: { in: ["PAID", "FULFILLED"] } },
        _sum: { totalCents: true },
      }),
      db.product.findMany({
        where: { active: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, title: true, stock: true, slug: true },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          totalCents: true,
          createdAt: true,
        },
      }),
    ]);

  const revenueCents = paidAgg._sum.totalCents ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active products" value={String(productCount)} />
        <Stat label="Orders" value={String(orderCount)} />
        <Stat label="Revenue (paid)" value={formatCents(revenueCents)} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everything is well stocked.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex justify-between gap-4">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="truncate hover:underline"
                    >
                      {p.title}
                    </Link>
                    <span
                      className={
                        p.stock === 0
                          ? "shrink-0 text-destructive"
                          : "shrink-0 text-amber-600"
                      }
                    >
                      {p.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs">{o.orderNumber}</p>
                      <p className="truncate text-muted-foreground">{o.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant="outline">{o.status}</Badge>
                      <span className="tabular-nums">
                        {formatCents(o.totalCents)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
