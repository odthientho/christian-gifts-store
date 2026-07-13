"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteProductAction } from "@/server/actions";

export function DeleteButton({ slug, title }: { slug: string; title: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function remove() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    start(async () => {
      await deleteProductAction(slug);
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
