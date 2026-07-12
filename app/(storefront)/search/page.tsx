import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { searchProducts } from "@/lib/products";
import { getDictionary, interpolate } from "@/lib/i18n";
import { ProductCard } from "@/components/storefront/product-card";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.search.title };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, dict] = await Promise.all([searchParams, getDictionary()]);
  const query = (q ?? "").trim();
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        {dict.search.title}
      </h1>

      {query ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.search.resultsFor}{" "}
          <span className="font-medium text-foreground">“{query}”</span> ·{" "}
          {interpolate(dict.search.count, { n: results.length })}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{dict.search.empty}</p>
      )}

      {query && results.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed py-20 text-center">
          <SearchX
            className="mx-auto size-8 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <p className="mt-3 font-medium">{dict.search.noResults}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.search.noResultsSub}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
