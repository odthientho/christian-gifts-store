import Link from "next/link";

import { ProductCard } from "@/components/storefront/product-card";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>

      {categories.length > 0 && (
        <div
          className="mt-8 flex flex-wrap gap-2 border-b pb-6"
          role="group"
          aria-label="Filter by category"
        >
          <FilterPill href={basePath} active={!activeCategory}>
            All
          </FilterPill>
          {categories.map((c) => (
            <FilterPill
              key={c.slug}
              href={`${basePath}?category=${c.slug}`}
              active={activeCategory === c.slug}
            >
              {c.name}
            </FilterPill>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "item" : "items"}
      </p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">Nothing here yet.</p>
          <Link
            href={basePath}
            className="mt-2 inline-block text-sm underline underline-offset-4"
          >
            Clear the filter
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
