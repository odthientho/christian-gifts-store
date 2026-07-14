"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deletePromoTileAction } from "@/server/actions";

export function DeletePromoTileButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function remove() {
    if (!confirm(`Delete tile "${label}"? This cannot be undone.`)) return;
    start(async () => {
      await deletePromoTileAction(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={remove}
      disabled={pending}
      className="ml-4 text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
