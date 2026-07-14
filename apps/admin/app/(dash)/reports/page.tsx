import Link from "next/link";

import { apiAdminReports } from "@/lib/api";
import { formatCents } from "@gin/contracts";
import type { SalesPeriodDTO } from "@gin/contracts";
import { SalesChart } from "@/components/reports/sales-chart";

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period: SalesPeriodDTO =
    periodParam === "day" || periodParam === "year" ? periodParam : "month";

  const reports = await apiAdminReports(period);

  if (!reports) {
    return <p className="text-sm text-red-600">Could not load reports.</p>;
  }

  const chartPoints = reports.revenue.map((p) => ({
    label: formatLabel(period, p.label),
    totalCents: p.totalCents,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reports</h1>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/reports?period=${p.value}`}
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

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">Revenue</h2>
        <SalesChart points={chartPoints} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            Top customers
          </h2>
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

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            Sales by category
          </h2>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Units sold</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.categorySales.map((c) => (
                <tr key={c.name}>
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 text-right tabular-nums text-neutral-500">
                    {c.quantitySold}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    {formatCents(c.totalCents)}
                  </td>
                </tr>
              ))}
              {reports.categorySales.length === 0 && (
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
            Low stock
          </h2>
          <ul className="space-y-3">
            {reports.lowStockProducts.map((p) => (
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
            {reports.lowStockProducts.length === 0 && (
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
