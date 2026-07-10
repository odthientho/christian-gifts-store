import type { Metadata } from "next";

import { getCategories, getProductsByType } from "@/lib/products";
import { CatalogGrid } from "@/components/storefront/catalog-grid";

export const metadata: Metadata = { title: "Books" };

// `searchParams` is a Promise in Next.js 16 — synchronous access was removed.
export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [products, categories] = await Promise.all([
    getProductsByType("BOOK", { categorySlug: category }),
    getCategories("BOOK"),
  ]);

  return (
    <CatalogGrid
      title="Books"
      description="Study Bibles, devotionals, theology, and books for children."
      basePath="/books"
      products={products}
      categories={categories}
      activeCategory={category}
    />
  );
}
