import type { Metadata } from "next";

import { getCategories, getProductsByType } from "@/lib/products";
import { CatalogGrid } from "@/components/storefront/catalog-grid";

export const metadata: Metadata = { title: "Gifts" };

export default async function GiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [products, categories] = await Promise.all([
    getProductsByType("GIFT", { categorySlug: category }),
    getCategories("GIFT"),
  ]);

  return (
    <CatalogGrid
      title="Gifts"
      description="Handmade crosses, rosaries, jewelry, and pieces for the home."
      basePath="/gifts"
      products={products}
      categories={categories}
      activeCategory={category}
    />
  );
}
