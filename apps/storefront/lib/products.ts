import type { ProductTypeDTO } from "@gin/contracts";
import {
  apiListProducts,
  apiGetProduct,
  apiListCategories,
  type ApiProduct,
} from "@/lib/api-client";

type ProductType = ProductTypeDTO;

// Public product reads now go through the GIN API (headless). The DTO the API
// returns already carries everything the storefront components need — category
// (with slug), and the book/gift detail used on cards and the product page — so
// call sites did not change shape.

export async function getFeaturedProducts(limit = 6): Promise<ApiProduct[]> {
  return apiListProducts({ featured: true, limit });
}

/** Newest active products, for the "New arrivals" grid. */
export async function getNewProducts(limit = 10): Promise<ApiProduct[]> {
  return apiListProducts({ limit });
}

/**
 * One showcase per category that has active products, with its first few
 * products. Fetches the category list, then each category's products from the
 * API. `type` is derived from the products so the storefront knows whether the
 * category lives under /books or /gifts.
 */
export async function getCategoryShowcases(perCategory = 4) {
  const categories = await apiListCategories();
  const showcases = await Promise.all(
    categories.map(async (c) => {
      const products = await apiListProducts({
        category: c.slug,
        limit: perCategory,
      });
      return { id: c.id, slug: c.slug, name: c.name, imageUrl: c.imageUrl, products };
    }),
  );
  return showcases
    .filter((s) => s.products.length > 0)
    .map((s) => ({ ...s, type: s.products[0]!.type }));
}

export async function getProductsByType(
  type: ProductType,
  opts: { categorySlug?: string; search?: string } = {},
): Promise<ApiProduct[]> {
  return apiListProducts({
    type,
    category: opts.categorySlug,
    search: opts.search,
  });
}

/** Search across active products of both types. */
export async function searchProducts(query: string): Promise<ApiProduct[]> {
  const q = query.trim();
  if (!q) return [];
  return apiListProducts({ search: q, limit: 60 });
}

export async function getProductBySlug(slug: string): Promise<ApiProduct | null> {
  return apiGetProduct(slug);
}

export async function getCategories(type?: ProductType) {
  return apiListCategories(type);
}
