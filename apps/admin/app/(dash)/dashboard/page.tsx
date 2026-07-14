import Link from "next/link";
import { DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";

import { apiAdminDashboard } from "@/lib/api";
import { formatCents } from "@gin/contracts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total sales"
          value={formatCents(summary.totalSalesCents)}
          icon={DollarSign}
        />
        <KpiCard
          label="Total orders"
          value={summary.totalOrders.toString()}
          icon={ShoppingCart}
          tone="neutral"
        />
        <KpiCard
          label="Needs review"
          value={summary.ordersNeedingReview.toString()}
          icon={AlertTriangle}
          tone={summary.ordersNeedingReview > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Revenue — last 14 days
          </h2>
          <RevenueChart days={summary.revenueByDay} />
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">Top categories</h2>
          <CategoryDonut categories={summary.topCategories} />
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
