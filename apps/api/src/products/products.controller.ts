import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  type ProductQuery,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@gin/contracts";

import { ProductsService } from "./products.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards.js";

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // --- Public ---------------------------------------------------------------

  @Get("products")
  list(
    @Query(new ZodValidationPipe(productQuerySchema)) query: ProductQuery,
  ) {
    return this.products.list(query);
  }

  @Get("products/:slug")
  getOne(@Param("slug") slug: string) {
    return this.products.getBySlug(slug);
  }

  @Get("categories")
  categories(@Query("type") type?: "BOOK" | "GIFT") {
    return this.products.categories(type);
  }

  // --- Admin (guarded) ------------------------------------------------------

  @Get("admin/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listAll() {
    return this.products.listAll();
  }

  @Get("admin/products/:slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  getForAdmin(@Param("slug") slug: string) {
    return this.products.getAnyBySlug(slug);
  }

  @Post("admin/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  create(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductInput,
  ) {
    return this.products.create(body);
  }

  @Patch("admin/products/:slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  update(
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductInput,
  ) {
    return this.products.update(slug, body);
  }

  @Delete("admin/products/:slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async remove(@Param("slug") slug: string) {
    await this.products.remove(slug);
  }

  // --- Admin: categories (guarded) -------------------------------------------

  @Get("admin/categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listAllCategories() {
    return this.products.listAllCategories();
  }

  @Post("admin/categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  createCategory(
    @Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryInput,
  ) {
    return this.products.createCategory(body);
  }

  @Patch("admin/categories/:slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateCategory(
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryInput,
  ) {
    return this.products.updateCategory(slug, body);
  }

  @Delete("admin/categories/:slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async removeCategory(@Param("slug") slug: string) {
    await this.products.removeCategory(slug);
  }
}
