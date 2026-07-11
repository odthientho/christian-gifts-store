"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";

import { addToCartAction } from "@/server/cart";
import { Button } from "@/components/ui/button";

export type AddToCartLabels = {
  add: string;
  adding: string;
  added: string;
  soldOut: string;
  quantity: string;
};

export function AddToCartButton({
  productId,
  disabled,
  labels,
}: {
  productId: string;
  disabled?: boolean;
  labels: AddToCartLabels;
}) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    startTransition(async () => {
      // The action re-reads the price and stock from the database. This
      // component only ever sends an id and a quantity.
      const result = await addToCartAction({ productId, quantity });
      if (result.ok) {
        toast.success(labels.added);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-11 items-center rounded-lg border bg-card px-1">
        <label htmlFor="qty" className="sr-only">
          {labels.quantity}
        </label>
        <select
          id="qty"
          value={quantity}
          disabled={disabled || pending}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="h-9 rounded-md bg-transparent px-2 text-sm tabular-nums outline-none disabled:opacity-50"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={add}
        disabled={disabled || pending}
        className="h-11 min-w-44 flex-1 gap-2 px-6 text-sm sm:flex-none"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {labels.adding}
          </>
        ) : disabled ? (
          labels.soldOut
        ) : (
          <>
            <ShoppingBag className="size-4" strokeWidth={1.75} />
            {labels.add}
          </>
        )}
      </Button>
    </div>
  );
}
