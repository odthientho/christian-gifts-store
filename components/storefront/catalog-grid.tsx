import Link from "next/link";

import { ProductCard } from "@/components/storefront/product-card";
import { Badge } from "@/components/ui/badge";

type Product = React.ComponentProps<typeof ProductCard>["product"] & {
  id: string;
};

type CatalogGridProps = {
  title: string;
  description: string;
  basePath: string;
  products: Product[];
  categories: { slug: string; name: string }[];
  activeCategory?: string;
};

export function CatalogGrid({
  title,
  description,
  basePath,
  products,
  categories,
  activeCategory,
}: CatalogGridProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </header>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href={basePath}>
            <Badge variant={activeCategory ? "outline" : "default"}>All</Badge>
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`${basePath}?category=${c.slug}`}>
              <Badge
                variant={activeCategory === c.slug ? "default" : "outline"}
              >
                {c.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
