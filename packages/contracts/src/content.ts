import { z } from "zod";

// Storefront content the admin can edit without a deploy: the home page's
// hero carousel and promo tiles. Both languages are required — the storefront
// is bilingual and there is no good fallback for a missing translation on a
// piece of homepage marketing copy.

export type HeroSlideDTO = {
  id: string;
  order: number;
  active: boolean;
  verseRefVi: string;
  verseRefEn: string;
  textVi: string;
  textEn: string;
  imageUrl: string | null;
};

export const heroSlideSchema = z.object({
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  verseRefVi: z.string().trim().min(1).max(120),
  verseRefEn: z.string().trim().min(1).max(120),
  textVi: z.string().trim().min(1).max(500),
  textEn: z.string().trim().min(1).max(500),
  imageUrl: z.string().trim().max(2048).nullish(),
});
export type HeroSlideInput = z.infer<typeof heroSlideSchema>;

export type PromoTileDTO = {
  id: string;
  order: number;
  active: boolean;
  labelVi: string;
  labelEn: string;
  href: string;
  imageUrl: string | null;
};

export const promoTileSchema = z.object({
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  labelVi: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  // Internal link only — this renders as a homepage tile's href, not a place
  // for an admin to point storefront traffic off-site.
  href: z.string().trim().min(1).max(200).regex(/^\/(?!\/)/, "Must be a path starting with /"),
  imageUrl: z.string().trim().max(2048).nullish(),
});
export type PromoTileInput = z.infer<typeof promoTileSchema>;
