"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Trash2 } from "lucide-react";

import type { CartLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { updateCartItemAction } from "@/server/cart";
import { Button } from "@/components/ui/button";
import { toAbsoluteImageUrl } from "@/lib/image-url";

export function CartLines({
  lines,
  removeLabel,
}: {
  lines: CartLine[];
  removeLabel: string;
}) {
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
        <li
          key={line.productId}
          className="flex gap-4 py-5 transition-opacity data-[pending=true]:opacity-60"
          data-pending={pending}
        >
          <Link
            href={`/products/${line.slug}`}
            className="size-20 shrink-0 overflow-hidden rounded-lg border bg-card"
          >
            {line.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={toAbsoluteImageUrl(line.imageUrl)}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="product-placeholder grid size-full place-items-center">
                <Package className="size-6 text-primary/35" strokeWidth={1.25} />
              </div>
            )}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div className="flex justify-between gap-4">
              <Link
                href={`/products/${line.slug}`}
                className="font-heading font-medium leading-snug hover:underline"
              >
                {line.title}
              </Link>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCents(line.lineTotalCents)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
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
                  className="h-9 rounded-lg border bg-card px-2.5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
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
                aria-label={`${removeLabel} — ${line.title}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
