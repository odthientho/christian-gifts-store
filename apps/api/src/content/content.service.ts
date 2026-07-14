import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@gin/db";
import type {
  HeroSlideDTO,
  HeroSlideInput,
  PromoTileDTO,
  PromoTileInput,
} from "@gin/contracts";

@Injectable()
export class ContentService {
  // --- Hero slides -------------------------------------------------------

  /** Public: active slides only, in display order. */
  async listActiveHeroSlides(): Promise<HeroSlideDTO[]> {
    return prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }

  /** Admin: every slide, including hidden ones. */
  async listAllHeroSlides(): Promise<HeroSlideDTO[]> {
    return prisma.heroSlide.findMany({ orderBy: { order: "asc" } });
  }

  async createHeroSlide(input: HeroSlideInput): Promise<HeroSlideDTO> {
    return prisma.heroSlide.create({
      data: { ...input, imageUrl: input.imageUrl ?? null },
    });
  }

  async updateHeroSlide(id: string, input: Partial<HeroSlideInput>): Promise<HeroSlideDTO> {
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Hero slide not found");
    return prisma.heroSlide.update({ where: { id }, data: input });
  }

  async removeHeroSlide(id: string): Promise<void> {
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Hero slide not found");
    await prisma.heroSlide.delete({ where: { id } });
  }

  // --- Promo tiles ---------------------------------------------------------

  async listActivePromoTiles(): Promise<PromoTileDTO[]> {
    return prisma.promoTile.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }

  async listAllPromoTiles(): Promise<PromoTileDTO[]> {
    return prisma.promoTile.findMany({ orderBy: { order: "asc" } });
  }

  async createPromoTile(input: PromoTileInput): Promise<PromoTileDTO> {
    return prisma.promoTile.create({
      data: { ...input, imageUrl: input.imageUrl ?? null },
    });
  }

  async updatePromoTile(id: string, input: Partial<PromoTileInput>): Promise<PromoTileDTO> {
    const existing = await prisma.promoTile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promo tile not found");
    return prisma.promoTile.update({ where: { id }, data: input });
  }

  async removePromoTile(id: string): Promise<void> {
    const existing = await prisma.promoTile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promo tile not found");
    await prisma.promoTile.delete({ where: { id } });
  }
}
