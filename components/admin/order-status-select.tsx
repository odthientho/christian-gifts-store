"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/server/products";

const STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={status}
      disabled={pending}
      aria-label="Order status"
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          // The action validates the status against an allowlist and re-checks
          // requireAdmin(); this <select> is only a convenience.
          const result = await updateOrderStatusAction(orderId, next);
          if (result.ok) {
            toast.success(`Order marked ${next.toLowerCase()}`);
            router.refresh();
          } else {
            toast.error(result.error ?? "Could not update.");
          }
        });
      }}
      className="h-8 rounded-md border bg-background px-2 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
