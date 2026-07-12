import Link from "next/link";

import { ProductCard, type CardProduct } from "@/components/storefront/product-card";
import { translateCategory, type Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CatalogGridProps = {
  title: string;
  description: string;
  basePath: string;
  products: CardProduct[];
  categories: { slug: string; name: string }[];
  activeCategory?: string;
  dict: Dictionary;
};

export function CatalogGrid({
  title,
  description,
  basePath,
  products,
  categories,
  activeCategory,
  dict,
}: CatalogGridProps) {
  const noun = products.length === 1 ? dict.catalog.item : dict.catalog.items;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
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
            {dict.catalog.all}
          </FilterPill>
          {categories.map((c) => (
            <FilterPill
              key={c.slug}
              href={`${basePath}?category=${c.slug}`}
              active={activeCategory === c.slug}
            >
              {translateCategory(dict, c.slug, c.name)}
            </FilterPill>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        {products.length} {noun}
      </p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">{dict.catalog.nothing}</p>
          <Link
            href={basePath}
            className="mt-2 inline-block text-sm underline underline-offset-4"
          >
            {dict.catalog.clearFilter}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} dict={dict} />
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
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
