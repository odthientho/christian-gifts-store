import type { Metadata } from "next";

import { getCategories, getProductsByType } from "@/lib/products";
import { getDictionary } from "@/lib/i18n";
import { CatalogGrid } from "@/components/storefront/catalog-grid";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.catalog.booksTitle };
}

// `searchParams` is a Promise in Next.js 16 — synchronous access was removed.
export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [products, categories, dict] = await Promise.all([
    getProductsByType("BOOK", { categorySlug: category }),
    getCategories("BOOK"),
    getDictionary(),
  ]);

  return (
    <CatalogGrid
      title={dict.catalog.booksTitle}
      description={dict.catalog.booksDesc}
      basePath="/books"
      products={products}
      categories={categories}
      activeCategory={category}
      dict={dict}
    />
  );
}
