import type { Metadata } from "next";

import { getCategories, getProductsByType } from "@/lib/products";
import { getDictionary } from "@/lib/i18n";
import { CatalogGrid } from "@/components/storefront/catalog-grid";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.catalog.giftsTitle };
}

export default async function GiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [products, categories, dict] = await Promise.all([
    getProductsByType("GIFT", { categorySlug: category }),
    getCategories("GIFT"),
    getDictionary(),
  ]);

  return (
    <CatalogGrid
      title={dict.catalog.giftsTitle}
      description={dict.catalog.giftsDesc}
      basePath="/gifts"
      products={products}
      categories={categories}
      activeCategory={category}
      dict={dict}
    />
  );
}
