"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import type { CartLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { updateCartItemAction } from "@/server/cart";
import { Button } from "@/components/ui/button";

export function CartLines({ lines }: { lines: CartLine[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function update(productId: string, quantity: number) {
    startTransition(async () => {
      const result = await updateCartItemAction({ productId, quantity });
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="divide-y">
      {lines.map((line) => (
        <li key={line.productId} className="flex gap-4 py-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {line.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={line.imageUrl}
                alt={line.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-2xl opacity-30">
                📦
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between">
            <div className="flex justify-between gap-4">
              <Link
                href={`/products/${line.slug}`}
                className="font-medium hover:underline"
              >
                {line.title}
              </Link>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCents(line.lineTotalCents)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor={`qty-${line.productId}`} className="sr-only">
                  Quantity for {line.title}
                </label>
                <select
                  id={`qty-${line.productId}`}
                  value={line.quantity}
                  disabled={pending}
                  onChange={(e) =>
                    update(line.productId, Number(e.target.value))
                  }
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                >
                  {Array.from(
                    { length: Math.max(line.stock, line.quantity) },
                    (_, i) => i + 1,
                  )
                    .slice(0, 20)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                </select>
                <span className="text-sm text-muted-foreground tabular-nums">
                  × {formatCents(line.unitPriceCents)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => update(line.productId, 0)}
                aria-label={`Remove ${line.title}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
