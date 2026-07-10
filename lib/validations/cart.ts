import { z } from "zod";

// The client may send product ids and quantities. It may never send a price.
// Every total is recomputed from the database at checkout.

export const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  productId: z.string().cuid(),
  // 0 removes the line.
  quantity: z.number().int().min(0).max(99),
});

export const checkoutSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
