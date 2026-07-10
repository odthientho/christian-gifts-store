import Link from "next/link";

import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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

  return (
    <Card className="group overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {product.imageUrl ? (
            // Seeded products have no images; a plain <img> keeps the demo free
            // of remote-host config in next.config.ts.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <span className="text-4xl opacity-30">
                {product.type === "BOOK" ? "📖" : "🎁"}
              </span>
            </div>
          )}
          {soldOut && (
            <Badge variant="destructive" className="absolute right-2 top-2">
              Sold out
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="space-y-1">
        {product.category && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.category.name}
          </p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 font-medium leading-snug hover:underline">
            {product.title}
          </h3>
        </Link>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="font-semibold tabular-nums">
          {formatCents(product.priceCents)}
        </span>
        {!soldOut && product.stock <= 5 && (
          <span className="text-xs text-amber-600">
            Only {product.stock} left
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
