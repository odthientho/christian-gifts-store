import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { prisma } from "@gin/db";
import {
  dollarsToCents,
  type ProductDTO,
  type CategoryDTO,
  type ProductQuery,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@gin/contracts";

import { toProductDTO, productInclude } from "./product.mapper.js";

// A product page reads "0" or "3 left" as fine until an admin actually looks;
// this is also what makes a listing show up on the dashboard's low-stock
// widget and the admin sidebar badge — one threshold, shared everywhere.
export const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class ProductsService {
  /** Public catalog listing. Only active products are ever returned. */
  async list(query: ProductQuery): Promise<ProductDTO[]> {
    const searchIds = query.search
      ? await this.searchProductIds(query.search)
      : undefined;

    const rows = await prisma.product.findMany({
      where: {
        active: true,
        ...(query.type ? { type: query.type } : {}),
        ...(query.featured ? { featured: true } : {}),
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(searchIds ? { id: { in: searchIds } } : {}),
      },
      orderBy: query.featured
        ? { createdAt: "desc" }
        : { title: "asc" },
      take: query.limit ?? 100,
      include: productInclude,
    });
    return rows.map(toProductDTO);
  }

  /**
   * Accent- and case-insensitive substring match over title and description,
   * via Postgres's `unaccent` extension. A plain `contains` misses "kinh
   * thanh" against "Kinh Thánh" — the accented and unaccented forms are
   * different strings to a byte-for-byte comparison. Runs as a separate
   * query (rather than inline SQL fragments in the main `findMany`) so the
   * rest of the filtering, ordering, and `include` stays regular Prisma.
   */
  private async searchProductIds(search: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE unaccent(lower(title)) LIKE '%' || unaccent(lower(${search})) || '%'
         OR unaccent(lower(description)) LIKE '%' || unaccent(lower(${search})) || '%'
    `;
    return rows.map((r) => r.id);
  }

  /** Count of active products at or below the low-stock threshold. */
  async countLowStock(): Promise<number> {
    return prisma.product.count({
      where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } },
    });
  }

  /** Admin listing — includes inactive products, which the public list hides. */
  async listAll(): Promise<ProductDTO[]> {
    const rows = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: productInclude,
    });
    return rows.map(toProductDTO);
  }

  /** Admin single fetch by slug — active or not. */
  async getAnyBySlug(slug: string): Promise<ProductDTO> {
    const row = await prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!row) throw new NotFoundException("Product not found");
    return toProductDTO(row);
  }

  async getBySlug(slug: string): Promise<ProductDTO> {
    const row = await prisma.product.findFirst({
      where: { slug, active: true },
      include: productInclude,
    });
    if (!row) throw new NotFoundException("Product not found");
    return toProductDTO(row);
  }

  async categories(type?: "BOOK" | "GIFT"): Promise<CategoryDTO[]> {
    const rows = await prisma.category.findMany({
      where: type
        ? { products: { some: { type, active: true } } }
        : undefined,
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, imageUrl: true },
    });
    return rows;
  }

  // --- Admin: categories -----------------------------------------------------
  // Unlike `categories()` above, these are not filtered to categories that
  // currently have active products — the admin needs to see and manage an
  // empty category too.

  async listAllCategories(): Promise<CategoryDTO[]> {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, imageUrl: true },
    });
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryDTO> {
    try {
      return await prisma.category.create({
        data: { slug: input.slug, name: input.name, imageUrl: input.imageUrl ?? null },
        select: { id: true, slug: true, name: true, imageUrl: true },
      });
    } catch (e) {
      throw this.rethrowConflict(e, input.slug, "category");
    }
  }

  async updateCategory(
    slug: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryDTO> {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException("Category not found");
    try {
      return await prisma.category.update({
        where: { slug },
        data: { slug: input.slug, name: input.name, imageUrl: input.imageUrl },
        select: { id: true, slug: true, name: true, imageUrl: true },
      });
    } catch (e) {
      throw this.rethrowConflict(e, input.slug ?? slug, "category");
    }
  }

  /**
   * Delete a category. Its products are not deleted — `onDelete: SetNull` on
   * Product.categoryId (see schema) just leaves them uncategorised.
   */
  async removeCategory(slug: string): Promise<void> {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException("Category not found");
    await prisma.category.delete({ where: { slug } });
  }

  // --- Admin: products ---------------------------------------------------

  async create(input: CreateProductInput): Promise<ProductDTO> {
    const categoryId = await this.resolveCategoryId(input.categorySlug);
    try {
      const row = await prisma.product.create({
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description,
          type: input.type,
          priceCents: dollarsToCents(input.priceDollars),
          imageUrl: input.imageUrl ?? null,
          stock: input.stock,
          active: input.active,
          featured: input.featured,
          categoryId,
        },
        include: productInclude,
      });
      return toProductDTO(row);
    } catch (e) {
      throw this.rethrowConflict(e, input.slug);
    }
  }

  async update(slug: string, input: UpdateProductInput): Promise<ProductDTO> {
    await this.getExistingId(slug);
    const categoryId =
      input.categorySlug === undefined
        ? undefined
        : await this.resolveCategoryId(input.categorySlug);
    try {
      const row = await prisma.product.update({
        where: { slug },
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description,
          type: input.type,
          priceCents:
            input.priceDollars === undefined
              ? undefined
              : dollarsToCents(input.priceDollars),
          imageUrl: input.imageUrl,
          stock: input.stock,
          active: input.active,
          featured: input.featured,
          categoryId,
        },
        include: productInclude,
      });
      return toProductDTO(row);
    } catch (e) {
      throw this.rethrowConflict(e, input.slug ?? slug);
    }
  }

  async remove(slug: string): Promise<void> {
    await this.getExistingId(slug);
    await prisma.product.delete({ where: { slug } });
  }

  // --- helpers -------------------------------------------------------------

  private async getExistingId(slug: string): Promise<string> {
    const found = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Product not found");
    return found.id;
  }

  private async resolveCategoryId(
    slug: string | null | undefined,
  ): Promise<string | null> {
    if (!slug) return null;
    const cat = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!cat) throw new NotFoundException(`Category "${slug}" not found`);
    return cat.id;
  }

  private rethrowConflict(
    e: unknown,
    slug: string,
    entity: "product" | "category" = "product",
  ): Error {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return new ConflictException(`A ${entity} with slug "${slug}" already exists`);
    }
    return e as Error;
  }
}
