"use client";

import { useState, useTransition } from "react";

import { updateOrderStatusAction } from "@/server/actions";

const STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function StatusForm({
  orderNumber,
  status,
  carrier,
  trackingNumber,
}: {
  orderNumber: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const [value, setValue] = useState(status);
  const [carrierValue, setCarrierValue] = useState(carrier ?? "");
  const [trackingValue, setTrackingValue] = useState(trackingNumber ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateOrderStatusAction(orderNumber, value, {
        carrier: carrierValue.trim() || undefined,
        trackingNumber: trackingValue.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="mt-2 space-y-3">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {(value === "SHIPPED" || value === "DELIVERED") && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={carrierValue}
            onChange={(e) => {
              setCarrierValue(e.target.value);
              setSaved(false);
            }}
            placeholder="Carrier (e.g. USPS)"
            disabled={pending}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
          />
          <input
            value={trackingValue}
            onChange={(e) => {
              setTrackingValue(e.target.value);
              setSaved(false);
            }}
            placeholder="Tracking number"
            disabled={pending}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
      )}

      <button
        onClick={save}
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save status"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && !error && <p className="text-xs text-emerald-600">Saved.</p>}
      <p className="text-xs text-neutral-400">
        Internal only — REFUNDED does not call Stripe. Issue the actual refund
        in the Stripe dashboard first. Carrier/tracking are stored for your
        own records only; nothing is sent to a carrier API.
      </p>
    </div>
  );
}
