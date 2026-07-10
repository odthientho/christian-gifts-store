"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { addToCartAction } from "@/server/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
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
        toast.success("Added to cart");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="qty" className="sr-only">
        Quantity
      </label>
      <select
        id="qty"
        value={quantity}
        disabled={disabled || pending}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="h-9 rounded-md border bg-background px-2 text-sm"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <Button onClick={add} disabled={disabled || pending} size="lg">
        {pending ? "Adding…" : disabled ? "Sold out" : "Add to cart"}
      </Button>
    </div>
  );
}
