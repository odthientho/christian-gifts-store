import Link from "next/link";
import { BookOpen, Gift } from "lucide-react";

import { formatCents } from "@/lib/money";

type ProductCardProps = {
  product: {
    slug: string;
    title: string;
    priceCents: number;
    imageUrl: string | null;
    stock: number;
    type: "BOOK" | "GIFT";
    category: { name: string } | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const soldOut = product.stock <= 0;
  const scarce = !soldOut && product.stock <= 5;
  const Icon = product.type === "BOOK" ? BookOpen : Gift;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group focus-visible:ring-ring/60 block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-lg group-hover:shadow-primary/5">
        <div className="relative aspect-[4/3] overflow-hidden">
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
              <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium tracking-wide text-background uppercase">
                Sold out
              </span>
            </div>
          )}

          {scarce && (
            <span className="absolute left-3 top-3 rounded-full bg-brass px-2.5 py-1 text-[0.7rem] font-medium text-brass-foreground shadow-sm">
              Only {product.stock} left
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          {product.category && (
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {product.category.name}
            </p>
          )}

          <h3 className="font-heading text-[0.98rem] leading-snug font-medium text-balance decoration-primary/30 underline-offset-4 group-hover:underline">
            {product.title}
          </h3>

          <p className="mt-auto pt-3 font-medium tabular-nums">
            {formatCents(product.priceCents)}
          </p>
        </div>
      </article>
    </Link>
  );
}
