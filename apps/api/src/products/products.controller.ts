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
  type ProductQuery,
  type CreateProductInput,
  type UpdateProductInput,
} from "@gin/contracts";

import { ProductsService } from "./products.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { AdminGuard } from "../common/admin.guard.js";

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

  @Post("admin/products")
  @UseGuards(AdminGuard)
  create(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductInput,
  ) {
    return this.products.create(body);
  }

  @Patch("admin/products/:slug")
  @UseGuards(AdminGuard)
  update(
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductInput,
  ) {
    return this.products.update(slug, body);
  }

  @Delete("admin/products/:slug")
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async remove(@Param("slug") slug: string) {
    await this.products.remove(slug);
  }
}
