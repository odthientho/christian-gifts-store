import { z } from "zod";

// The admin form works in dollars because that is what a human types. The
// database stores cents. The transform happens here, once, so no caller has to
// remember which unit it is holding.

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens only",
  );

const priceDollars = z
  .number({ error: "Price is required" })
  .min(0, "Price cannot be negative")
  .max(100_000, "Price is unrealistically high")
  .transform((dollars) => Math.round(dollars * 100));

const bookDetailSchema = z.object({
  author: z.string().trim().min(1, "Author is required").max(200),
  isbn: z
    .string()
    .trim()
    .regex(/^[0-9-]{10,17}$/, "ISBN must be 10-17 digits or hyphens")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  publisher: z.string().trim().max(200).optional(),
  pageCount: z.number().int().positive().max(20_000).optional(),
  language: z.string().trim().max(60).default("English"),
  format: z.enum(["HARDCOVER", "PAPERBACK", "EBOOK", "AUDIOBOOK"]),
});

const giftDetailSchema = z.object({
  material: z.string().trim().max(200).optional(),
  dimensions: z.string().trim().max(200).optional(),
  occasion: z.string().trim().max(120).optional(),
  handmade: z.boolean().default(false),
});

const baseProduct = z.object({
  slug,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5_000),
  priceDollars,
  imageUrl: z.url("Must be a valid URL").optional().or(z.literal("").transform(() => undefined)),
  stock: z.number().int().min(0, "Stock cannot be negative").max(1_000_000),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  categoryId: z.string().cuid().optional().or(z.literal("").transform(() => undefined)),
});

// A discriminated union means a BOOK can never be saved with gift fields, and
// the type of `detail` narrows correctly once you check `type`.
export const productSchema = z.discriminatedUnion("type", [
  baseProduct.extend({
    type: z.literal("BOOK"),
    book: bookDetailSchema,
  }),
  baseProduct.extend({
    type: z.literal("GIFT"),
    gift: giftDetailSchema,
  }),
]);

export type ProductInput = z.infer<typeof productSchema>;

export const productIdSchema = z.object({ id: z.string().cuid() });
