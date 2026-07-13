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
} from "@gin/contracts";

import { toProductDTO, productInclude } from "./product.mapper.js";

@Injectable()
export class ProductsService {
  /** Public catalog listing. Only active products are ever returned. */
  async list(query: ProductQuery): Promise<ProductDTO[]> {
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        ...(query.type ? { type: query.type } : {}),
        ...(query.featured ? { featured: true } : {}),
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: query.featured
        ? { createdAt: "desc" }
        : { title: "asc" },
      take: query.limit ?? 100,
      include: productInclude,
    });
    return rows.map(toProductDTO);
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
      select: { id: true, slug: true, name: true },
    });
    return rows;
  }

  // --- Admin ---------------------------------------------------------------

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

  private rethrowConflict(e: unknown, slug: string): Error {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return new ConflictException(`A product with slug "${slug}" already exists`);
    }
    return e as Error;
  }
}
