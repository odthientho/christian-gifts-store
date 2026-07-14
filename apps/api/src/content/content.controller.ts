import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, UseGuards } from "@nestjs/common";
import {
  heroSlideSchema,
  promoTileSchema,
  type HeroSlideInput,
  type PromoTileInput,
} from "@gin/contracts";

import { ContentService } from "./content.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards.js";

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  // --- Public --------------------------------------------------------------

  @Get("hero-slides")
  listHeroSlides() {
    return this.content.listActiveHeroSlides();
  }

  @Get("promo-tiles")
  listPromoTiles() {
    return this.content.listActivePromoTiles();
  }

  // --- Admin: hero slides ----------------------------------------------------

  @Get("admin/hero-slides")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listAllHeroSlides() {
    return this.content.listAllHeroSlides();
  }

  @Post("admin/hero-slides")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  createHeroSlide(@Body(new ZodValidationPipe(heroSlideSchema)) body: HeroSlideInput) {
    return this.content.createHeroSlide(body);
  }

  @Patch("admin/hero-slides/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateHeroSlide(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(heroSlideSchema.partial())) body: Partial<HeroSlideInput>,
  ) {
    return this.content.updateHeroSlide(id, body);
  }

  @Delete("admin/hero-slides/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async removeHeroSlide(@Param("id") id: string) {
    await this.content.removeHeroSlide(id);
  }

  // --- Admin: promo tiles ----------------------------------------------------

  @Get("admin/promo-tiles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listAllPromoTiles() {
    return this.content.listAllPromoTiles();
  }

  @Post("admin/promo-tiles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  createPromoTile(@Body(new ZodValidationPipe(promoTileSchema)) body: PromoTileInput) {
    return this.content.createPromoTile(body);
  }

  @Patch("admin/promo-tiles/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  updatePromoTile(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(promoTileSchema.partial())) body: Partial<PromoTileInput>,
  ) {
    return this.content.updatePromoTile(id, body);
  }

  @Delete("admin/promo-tiles/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async removePromoTile(@Param("id") id: string) {
    await this.content.removePromoTile(id);
  }
}
