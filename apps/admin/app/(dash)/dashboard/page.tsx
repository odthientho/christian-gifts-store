import Link from "next/link";
import { DollarSign, ShoppingCart, Users } from "lucide-react";

import { apiAdminDashboard, apiAdminReports } from "@/lib/api";
import { formatCents } from "@gin/contracts";
import type { SalesPeriodDTO } from "@gin/contracts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
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

// Past this, a still-unpaid order stops being "the normal lag right after
// checkout" and starts being "we might be about to lose this customer."
const OVERDUE_HOURS = 48;

const PERIODS: { value: SalesPeriodDTO; label: string }[] = [
  { value: "day", label: "By day (30d)" },
  { value: "month", label: "By month (12mo)" },
  { value: "year", label: "By year (5yr)" },
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-07-14" -> "Jul 14", "2026-07" -> "Jul 2026", "2026" -> "2026". */
function formatLabel(period: SalesPeriodDTO, label: string): string {
  if (period === "day") {
    const [, m, d] = label.split("-");
    return `${MONTH_NAMES[Number(m) - 1]} ${Number(d)}`;
  }
  if (period === "month") {
    const [y, m] = label.split("-");
    return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
  }
  return label;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period: SalesPeriodDTO =
    periodParam === "day" || periodParam === "year" ? periodParam : "month";

  const [summary, reports] = await Promise.all([
    apiAdminDashboard(),
    apiAdminReports(period),
  ]);

  if (!summary || !reports) {
    return <p className="text-sm text-red-600">Could not load dashboard data.</p>;
  }

  const pendingOverdue =
    summary.oldestPendingAgeHours !== null && summary.oldestPendingAgeHours >= OVERDUE_HOURS;

  // Folded into the Total orders tile rather than a separate panel — the
  // count that actually needs a click is right next to the total it's part of.
  const orderCaptionParts = [
    summary.pendingPaymentCount > 0
      ? `${summary.pendingPaymentCount} awaiting payment`
      : null,
    summary.ordersNeedingReview > 0 ? `${summary.ordersNeedingReview} need review` : null,
  ].filter(Boolean);
  const orderCaption =
    orderCaptionParts.length > 0 ? orderCaptionParts.join(" · ") : undefined;
  const orderCaptionTone =
    pendingOverdue || summary.ordersNeedingReview > 0
      ? "danger"
      : summary.pendingPaymentCount > 0
        ? "warning"
        : "neutral";

  const chartPoints = reports.revenue.map((p) => ({
    label: formatLabel(period, p.label),
    totalCents: p.totalCents,
  }));
  const categoryDonutData = reports.categorySales.map((c) => ({
    name: c.name,
    totalCents: c.totalCents,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
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
          tone={orderCaptionTone === "neutral" ? "neutral" : "warning"}
          changePct={summary.ordersChangePct}
          caption={orderCaption}
          captionTone={orderCaptionTone}
          href={orderCaption ? "/orders?status=PENDING" : undefined}
        />
        <KpiCard
          label="Customers"
          value={(summary.newCustomerCount + summary.returningCustomerCount).toString()}
          icon={Users}
          tone="neutral"
          caption={`${summary.newCustomerCount} new · ${summary.returningCustomerCount} returning`}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">Sales trends</h2>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/dashboard?period=${p.value}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                period === p.value
                  ? "bg-primary text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">Revenue</h2>
          <SalesChart points={chartPoints} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Top categories</h2>
            <CategoryDonut categories={categoryDonutData} />
          </div>
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Order status</h2>
            <StatusBreakdown statuses={summary.statusBreakdown} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Top customers</h2>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="pb-2">Customer</th>
                <th className="pb-2 text-right">Orders</th>
                <th className="pb-2 text-right">Total spent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.topCustomers.map((c) => (
                <tr key={c.email}>
                  <td className="py-2">
                    <p className="font-medium">{c.name ?? "—"}</p>
                    <p className="text-xs text-neutral-500">{c.email}</p>
                  </td>
                  <td className="py-2 text-right tabular-nums text-neutral-500">
                    {c.orderCount}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    {formatCents(c.totalCents)}
                  </td>
                </tr>
              ))}
              {reports.topCustomers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-neutral-500">
                    No sales in this period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            Top products — high demand
          </h2>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="pb-2">Product</th>
                <th className="pb-2 text-right">Units sold</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.topProducts.map((p) => (
                <tr key={p.slug}>
                  <td className="py-2">
                    <Link
                      href={`/products/${p.slug}/edit`}
                      className="hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="py-2 text-right tabular-nums text-neutral-500">
                    {p.quantitySold}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    {formatCents(p.totalCents)}
                  </td>
                </tr>
              ))}
              {reports.topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-neutral-500">
                    No sales in this period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
