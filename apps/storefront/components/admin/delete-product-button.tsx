"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteProductAction } from "@/server/products";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function remove() {
    startTransition(async () => {
      // The action re-checks requireAdmin() itself. This confirm step only
      // guards against a misclick.
      const result = await deleteProductAction(id);
      if (result.ok) {
        toast.success(`Removed "${title}"`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not delete.");
      }
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-destructive hover:text-destructive"
      >
        Delete
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={remove}
      >
        {pending ? "…" : "Confirm"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </Button>
    </span>
  );
}
