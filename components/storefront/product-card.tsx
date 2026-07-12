import Link from "next/link";
import { BookOpen, Gift, Star } from "lucide-react";

import { formatCents } from "@/lib/money";
import { interpolate, type Dictionary } from "@/lib/i18n";

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

  const meta =
    product.bookDetail?.author ?? product.giftDetail?.occasion ?? null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
        <div className="relative aspect-square overflow-hidden bg-ice">
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
                className="size-10 text-primary/40 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.25}
              />
            </div>
          )}

          {soldOut && (
            <div className="absolute inset-x-0 bottom-0 bg-foreground/85 py-1.5 text-center text-[0.7rem] font-medium uppercase tracking-wide text-background">
              {dict.product.outOfStock}
            </div>
          )}

          {scarce && (
            <span className="absolute left-2 top-2 rounded-full bg-brass px-2 py-0.5 text-[0.65rem] font-medium text-brass-foreground shadow-sm">
              {interpolate(dict.product.onlyLeft, { n: product.stock })}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          {/* Decorative rating row: empty outlines read as "not yet rated". */}
          <div className="flex gap-0.5" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className="size-3 text-muted-foreground/35"
                strokeWidth={1.5}
              />
            ))}
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground/90 group-hover:text-primary">
            {product.title}
          </h3>

          {meta && (
            <p className="truncate text-xs text-muted-foreground">{meta}</p>
          )}

          <p className="mt-auto pt-2 font-semibold text-primary tabular-nums">
            {formatCents(product.priceCents)}
          </p>
        </div>
      </article>
    </Link>
  );
}
