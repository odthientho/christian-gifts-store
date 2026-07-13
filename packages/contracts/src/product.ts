import { z } from "zod";

// The shared product contract. The API validates writes against these schemas
// and serves reads shaped as ProductDTO; the storefront and admin consume the
// same types, so the wire format is defined in exactly one place.

export const PRODUCT_TYPES = ["BOOK", "GIFT"] as const;
export type ProductTypeDTO = (typeof PRODUCT_TYPES)[number];

export type CategoryDTO = {
  id: string;
  slug: string;
  name: string;
};

export type ProductDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ProductTypeDTO;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
  category: CategoryDTO | null;
  bookDetail: {
    author: string;
    isbn: string | null;
    publisher: string | null;
    pageCount: number | null;
    language: string;
    format: string;
  } | null;
  giftDetail: {
    material: string | null;
    dimensions: string | null;
    occasion: string | null;
    handmade: boolean;
  } | null;
};

/** A slug: lowercase letters, numbers, and single hyphens. */
const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");

// Admin create payload. Prices arrive as dollars from the form and are
// transformed to integer cents so nothing downstream ever sees a float dollar.
export const createProductSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  type: z.enum(PRODUCT_TYPES),
  priceDollars: z.number().positive().max(100000),
  imageUrl: z.string().trim().max(2048).nullish(),
  stock: z.number().int().min(0).max(1000000),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  categorySlug: z.string().nullish(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  slug: slug.optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/** Storefront listing query. */
export const productQuerySchema = z.object({
  type: z.enum(PRODUCT_TYPES).optional(),
  category: z.string().optional(),
  search: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
