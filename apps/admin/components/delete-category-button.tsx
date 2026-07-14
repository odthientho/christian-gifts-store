"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCategoryAction } from "@/server/actions";

export function DeleteCategoryButton({ slug, name }: { slug: string; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function remove() {
    if (
      !confirm(
        `Delete "${name}"? Products in this category will become uncategorised. This cannot be undone.`,
      )
    )
      return;
    start(async () => {
      await deleteCategoryAction(slug);
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
