import { db } from "@/lib/db";
import type { ProductType } from "@/lib/generated/prisma/enums";
import {
  apiListProducts,
  apiGetProduct,
  apiListCategories,
  type ApiProduct,
} from "@/lib/api-client";

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
      return { id: c.id, slug: c.slug, name: c.name, products };
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

// --- Admin reads -----------------------------------------------------------
// These still read Postgres directly (they include inactive products, which the
// public API never exposes). They move to the admin app with its own API calls
// in the admin milestone; kept on `db` here so the current admin route group
// keeps working during the migration.

export async function getAllProductsForAdmin() {
  return db.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true, bookDetail: true, giftDetail: true },
  });
}

export async function getProductForAdmin(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { bookDetail: true, giftDetail: true },
  });
}
