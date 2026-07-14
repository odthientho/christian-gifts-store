"use client";

import { useState, useTransition } from "react";

import { updateOrderStatusAction } from "@/server/actions";

const STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];

export function StatusForm({
  orderNumber,
  status,
}: {
  orderNumber: string;
  status: string;
}) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: string) {
    setValue(next);
    setError(null);
    start(async () => {
      const res = await updateOrderStatusAction(orderNumber, next);
      if (!res.ok) {
        setError(res.error);
        setValue(status);
      }
    });
  }

  return (
    <div className="mt-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-neutral-400">
        Internal only — REFUNDED does not call Stripe. Issue the actual refund
        in the Stripe dashboard first.
      </p>
    </div>
  );
}
