import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Users,
  AlertTriangle,
  Clock,
  BarChart3,
} from "lucide-react";

import { apiAdminDashboard } from "@/lib/api";
import { formatCents } from "@gin/contracts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-neutral-100 text-neutral-600",
  PAID: "bg-emerald-100 text-emerald-700",
  FULFILLED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-neutral-100 text-neutral-500 line-through",
  REFUNDED: "bg-amber-100 text-amber-700",
};

export default async function DashboardPage() {
  const summary = await apiAdminDashboard();

  if (!summary) {
    return <p className="text-sm text-red-600">Could not load dashboard data.</p>;
  }

  const alerts = [
    summary.pendingPaymentCount > 0 && {
      key: "pending",
      icon: Clock,
      text: `${summary.pendingPaymentCount} order${summary.pendingPaymentCount === 1 ? "" : "s"} awaiting payment — contact the customer to collect payment and fulfil.`,
      href: "/orders?status=PENDING",
    },
    summary.ordersNeedingReview > 0 && {
      key: "review",
      icon: AlertTriangle,
      text: `${summary.ordersNeedingReview} order${summary.ordersNeedingReview === 1 ? "" : "s"} need review — paid but short on stock.`,
      href: "/orders",
    },
  ].filter((a): a is Exclude<typeof a, false> => a !== false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          href="/reports"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <BarChart3 className="size-4" strokeWidth={2} />
          Full reports →
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          <p className="border-b border-amber-200 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Needs attention
          </p>
          <ul className="divide-y divide-amber-200">
            {alerts.map((a) => (
              <li key={a.key}>
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-100"
                >
                  <span className="flex items-center gap-2.5">
                    <a.icon className="size-4 shrink-0" strokeWidth={2} />
                    {a.text}
                  </span>
                  <span className="shrink-0 font-medium underline">Review →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total sales"
          value={formatCents(summary.totalSalesCents)}
          icon={DollarSign}
          changePct={summary.salesChangePct}
        />
        <KpiCard
          label="Total orders"
          value={summary.totalOrders.toString()}
          icon={ShoppingCart}
          tone="neutral"
          changePct={summary.ordersChangePct}
        />
        <KpiCard
          label="Average order value"
          value={formatCents(summary.avgOrderValueCents)}
          icon={Receipt}
          tone="neutral"
        />
        <KpiCard
          label="Customers"
          value={(summary.newCustomerCount + summary.returningCustomerCount).toString()}
          icon={Users}
          tone="neutral"
          caption={`${summary.newCustomerCount} new · ${summary.returningCustomerCount} returning`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Revenue — last 14 days
          </h2>
          <RevenueChart days={summary.revenueByDay} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Top categories</h2>
            <CategoryDonut categories={summary.topCategories} />
          </div>
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Order status</h2>
            <StatusBreakdown statuses={summary.statusBreakdown} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">Recent orders</h2>
            <Link href="/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="pb-2">Order</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5">
                    <Link
                      href={`/orders/${o.orderNumber}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? ""}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 tabular-nums">{formatCents(o.totalCents)}</td>
                  <td className="py-2.5 text-neutral-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {summary.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-neutral-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">Low stock</h2>
          <ul className="space-y-3">
            {summary.lowStockProducts.map((p) => (
              <li key={p.slug} className="flex items-center justify-between text-sm">
                <Link href={`/products/${p.slug}/edit`} className="hover:underline">
                  {p.title}
                </Link>
                <span
                  className={`tabular-nums ${p.stock === 0 ? "font-semibold text-red-600" : "text-amber-600"}`}
                >
                  {p.stock} left
                </span>
              </li>
            ))}
            {summary.lowStockProducts.length === 0 && (
              <p className="py-10 text-center text-sm text-neutral-500">
                All active products are well stocked.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
