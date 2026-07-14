import { notFound } from "next/navigation";
import Link from "next/link";

import { apiAdminOrder } from "@/lib/api";
import { formatCents } from "@gin/contracts";
import { StatusForm } from "@/components/status-form";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await apiAdminOrder(orderNumber);
  if (!order) notFound();

  const address = [
    order.shippingName,
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingState, order.shippingPostal]
      .filter(Boolean)
      .join(", "),
    order.shippingCountry,
  ].filter(Boolean);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/orders" className="text-sm text-neutral-500 hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-1 font-mono text-xl font-semibold">
            {order.orderNumber}
          </h1>
        </div>
        {order.needsReview && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Needs review — paid but short on stock
          </span>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-500">Status</h2>
          <StatusForm orderNumber={order.orderNumber} status={order.status} />
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-500">Customer</h2>
          <p className="mt-2 text-sm">{order.email}</p>
          {address.length > 0 && (
            <address className="mt-3 text-sm text-neutral-600 not-italic">
              {address.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </address>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-500">Items</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2">{item.titleSnapshot}</td>
                <td className="py-2 text-right text-neutral-500">
                  × {item.quantity}
                </td>
                <td className="py-2 pl-4 text-right tabular-nums">
                  {formatCents(item.unitPriceCents * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t">
            <tr>
              <td colSpan={2} className="py-2 text-right text-neutral-500">
                Subtotal
              </td>
              <td className="py-2 pl-4 text-right tabular-nums">
                {formatCents(order.subtotalCents)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="py-2 text-right text-neutral-500">
                Shipping
              </td>
              <td className="py-2 pl-4 text-right tabular-nums">
                {formatCents(order.shippingCents)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="py-2 text-right font-semibold">
                Total
              </td>
              <td className="py-2 pl-4 text-right font-semibold tabular-nums">
                {formatCents(order.totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-neutral-500 sm:grid-cols-4">
        <div>
          <p className="font-medium text-neutral-700">Placed</p>
          <p>{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        {order.paidAt && (
          <div>
            <p className="font-medium text-neutral-700">Paid</p>
            <p>{new Date(order.paidAt).toLocaleString()}</p>
          </div>
        )}
        {order.stripePaymentIntentId && (
          <div className="col-span-2">
            <p className="font-medium text-neutral-700">Stripe payment</p>
            <p className="truncate font-mono">{order.stripePaymentIntentId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
