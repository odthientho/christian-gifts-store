import type { OrderStatusCountDTO } from "@gin/contracts";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-neutral-300",
  PAID: "bg-emerald-400",
  FULFILLED: "bg-blue-400",
  SHIPPED: "bg-indigo-400",
  DELIVERED: "bg-emerald-600",
  CANCELLED: "bg-neutral-200",
  REFUNDED: "bg-amber-400",
};

/** Every order status as a proportional bar — a funnel view, not just the 5 most recent rows. */
export function StatusBreakdown({ statuses }: { statuses: OrderStatusCountDTO[] }) {
  const total = statuses.reduce((s, x) => s + x.count, 0);

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-neutral-500">No orders yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {statuses
        .filter((s) => s.count > 0)
        .map((s) => (
          <div key={s.status} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 text-xs text-neutral-500">{s.status}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${STATUS_COLORS[s.status] ?? "bg-neutral-400"}`}
                style={{ width: `${(s.count / total) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right tabular-nums text-neutral-600">
              {s.count}
            </span>
          </div>
        ))}
    </div>
  );
}
