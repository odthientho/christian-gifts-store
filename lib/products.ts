import { db } from "@/lib/db";
import type { ProductType } from "@/lib/generated/prisma/enums";

// Read helpers for Server Components. Everything goes through the `db`
// singleton; no route builds its own Prisma client.

// Enough for a product card: the category (with slug, so it can be translated)
// plus the one detail field the card's meta line shows.
const cardInclude = {
  category: true,
  bookDetail: { select: { author: true, isbn: true } },
  giftDetail: { select: { occasion: true } },
} as const;

export async function getFeaturedProducts(limit = 6) {
  return db.product.findMany({
    where: { active: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: cardInclude,
  });
}

/** Newest active products, for the "New arrivals" grid. */
export async function getNewProducts(limit = 10) {
  return db.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: cardInclude,
  });
}

/**
 * One showcase per category that has active products: the category (with a
 * `type` derived from its products so the storefront knows whether it lives
 * under /books or /gifts) plus its first few products. Categories with no
 * active products are dropped.
 */
export async function getCategoryShowcases(perCategory = 4) {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: perCategory,
        include: cardInclude,
      },
    },
  });

  return categories
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      type: c.products[0]!.type,
      products: c.products,
    }));
}

export async function getProductsByType(
  type: ProductType,
  opts: { categorySlug?: string; search?: string } = {},
) {
  return db.product.findMany({
    where: {
      active: true,
      type,
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
      ...(opts.search
        ? {
            OR: [
              { title: { contains: opts.search, mode: "insensitive" } },
              { description: { contains: opts.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { title: "asc" },
    include: cardInclude,
  });
}

/** Full-text-ish search across active products of both types. */
export async function searchProducts(query: string) {
  const q = query.trim();
  if (!q) return [];
  return db.product.findMany({
    where: {
      active: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { bookDetail: { author: { contains: q, mode: "insensitive" } } },
      ],
    },
    orderBy: { title: "asc" },
    take: 60,
    include: cardInclude,
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, active: true },
    include: { category: true, bookDetail: true, giftDetail: true },
  });
}

export async function getCategories(type?: ProductType) {
  return db.category.findMany({
    where: type ? { products: { some: { type, active: true } } } : undefined,
    orderBy: { name: "asc" },
  });
}

/** Admin listing: includes inactive products. */
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
