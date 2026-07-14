import Link from "next/link";

import { apiAdminOrders } from "@/lib/api";
import { formatCents } from "@gin/contracts";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-neutral-100 text-neutral-600",
  PAID: "bg-emerald-100 text-emerald-700",
  FULFILLED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-neutral-100 text-neutral-500 line-through",
  REFUNDED: "bg-amber-100 text-amber-700",
};

export default async function OrdersPage() {
  const orders = await apiAdminOrders();
  const needingReview = orders.filter((o) => o.needsReview).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Orders</h1>
        {needingReview > 0 && (
          <p className="mt-1 text-sm text-red-600">
            {needingReview} order{needingReview === 1 ? "" : "s"} need review
            (paid but short on stock).
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Placed</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5 font-mono text-xs">
                  {o.orderNumber}
                  {o.needsReview && (
                    <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[0.65rem] font-sans font-medium text-red-700">
                      Review
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">{o.email}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? ""}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                  {formatCents(o.totalCents)}
                </td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/orders/${o.orderNumber}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
