"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ActionResult } from "@/server/actions";

/**
 * One reusable, on-brand confirm dialog + toast feedback for every destructive
 * action in the admin (products, categories, hero slides, promo tiles) —
 * replaces four near-identical `window.confirm()`-based buttons that gave no
 * feedback at all when the delete failed server-side.
 *
 * Native <dialog> rather than a hand-rolled modal: free focus trap, Escape to
 * close, and a real ::backdrop — no extra dependency for something the
 * platform already does correctly.
 */
export function DeleteButton({
  itemLabel,
  warning,
  action,
  successMessage,
}: {
  /** Rendered as `Delete {itemLabel}?` — pass e.g. `"ESV Study Bible"`. */
  itemLabel: string;
  /** Extra sentence shown below the standard "cannot be undone" line. */
  warning?: string;
  action: () => Promise<ActionResult>;
  successMessage: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dialogRef.current?.close();
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="ml-4 text-red-600 hover:underline"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setError(null)}
        className="w-full max-w-sm rounded-xl border p-0 shadow-lg backdrop:bg-black/40"
      >
        <div className="p-5">
          <h2 className="text-base font-semibold">Delete {itemLabel}?</h2>
          <p className="mt-2 text-sm text-neutral-600">
            This cannot be undone.{warning ? ` ${warning}` : ""}
          </p>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
              className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={pending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
