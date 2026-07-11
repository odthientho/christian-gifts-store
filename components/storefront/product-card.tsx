import Link from "next/link";
import { BookOpen, Gift } from "lucide-react";

import { formatCents } from "@/lib/money";
import {
  interpolate,
  translateCategory,
  type Dictionary,
} from "@/lib/i18n";

export type CardProduct = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  type: "BOOK" | "GIFT";
  category: { name: string; slug: string } | null;
  bookDetail?: { author: string; isbn: string | null } | null;
  giftDetail?: { occasion: string | null } | null;
};

export function ProductCard({
  product,
  dict,
}: {
  product: CardProduct;
  dict: Dictionary;
}) {
  const soldOut = product.stock <= 0;
  const scarce = !soldOut && product.stock <= 5;
  const Icon = product.type === "BOOK" ? BookOpen : Gift;

  // Reference cards carry a small meta line: the author for a book, the
  // occasion for a gift. Real data only — no fabricated SKUs.
  const meta =
    product.bookDetail?.author ?? product.giftDetail?.occasion ?? null;
  const code = product.bookDetail?.isbn ?? null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
        <div className="relative aspect-square overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="product-placeholder flex size-full items-center justify-center">
              <Icon
                className="size-11 text-primary/40 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.25}
              />
            </div>
          )}

          {soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-[1px]">
              <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium uppercase tracking-wide text-background">
                {dict.product.soldOut}
              </span>
            </div>
          )}

          {scarce && (
            <span className="absolute left-3 top-3 rounded-full bg-brass px-2.5 py-1 text-[0.7rem] font-medium text-brass-foreground shadow-sm">
              {interpolate(dict.product.onlyLeft, { n: product.stock })}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          {product.category && (
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-primary/80">
              {translateCategory(
                dict,
                product.category.slug,
                product.category.name,
              )}
            </p>
          )}

          <h3 className="font-heading text-[0.98rem] font-medium leading-snug text-balance decoration-primary/30 underline-offset-4 group-hover:underline">
            {product.title}
          </h3>

          {meta && (
            <p className="truncate text-xs text-muted-foreground">{meta}</p>
          )}

          <div className="mt-auto flex items-baseline justify-between pt-3">
            <span className="font-semibold tabular-nums">
              {formatCents(product.priceCents)}
            </span>
            {code && (
              <span className="font-mono text-[0.65rem] text-muted-foreground/70">
                {code}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
