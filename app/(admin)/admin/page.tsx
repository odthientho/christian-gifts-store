import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  DollarSign,
  Package,
  Receipt,
  type LucideIcon,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

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
        take: 6,
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          An overview of the store.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Active products"
          value={String(productCount)}
          icon={Package}
        />
        <Stat label="Orders" value={String(orderCount)} icon={Receipt} />
        <Stat
          label="Revenue"
          value={formatCents(revenueCents)}
          icon={DollarSign}
          hint="Paid and fulfilled"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Low stock"
          hint={lowStock.length > 0 ? `${lowStock.length} need attention` : undefined}
        >
          {lowStock.length === 0 ? (
            <Empty>Everything is well stocked.</Empty>
          ) : (
            <ul className="divide-y">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {p.stock === 0 && (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-destructive"
                          strokeWidth={2}
                        />
                      )}
                      <span className="truncate">{p.title}</span>
                    </span>
                    <span
                      className={
                        p.stock === 0
                          ? "shrink-0 font-medium text-destructive tabular-nums"
                          : "shrink-0 font-medium text-brass-foreground tabular-nums"
                      }
                    >
                      {p.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent orders">
          {recentOrders.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <ul className="divide-y">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs">{o.orderNumber}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-sm font-medium tabular-nums">
                      {formatCents(o.totalCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground/60" strokeWidth={1.75} />
      </div>
      <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
