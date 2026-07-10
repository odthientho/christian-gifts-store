import { db } from "@/lib/db";
import type { ProductType } from "@/lib/generated/prisma/enums";

// Read helpers for Server Components. Everything goes through the `db`
// singleton; no route builds its own Prisma client.

export async function getFeaturedProducts(limit = 6) {
  return db.product.findMany({
    where: { active: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { category: true },
  });
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
    include: { category: true },
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
