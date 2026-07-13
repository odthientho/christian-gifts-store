import { z } from "zod";

/** Free shipping at or above this subtotal. Cents. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;
/** Flat rate below the threshold. Cents. */
export const FLAT_SHIPPING_CENTS = 599;

/** Shipping for a given subtotal. An empty cart never ships. */
export function shippingForSubtotal(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
    ? 0
    : FLAT_SHIPPING_CENTS;
}

export type CartLineDTO = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  lineTotalCents: number;
};

export type CartViewDTO = {
  id: string | null;
  /** Opaque cart token — the storefront stores this in an httpOnly cookie. */
  token: string | null;
  lines: CartLineDTO[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
};

export const EMPTY_CART: CartViewDTO = {
  id: null,
  token: null,
  lines: [],
  subtotalCents: 0,
  shippingCents: 0,
  totalCents: 0,
  itemCount: 0,
};

export const addToCartSchema = z.object({
  token: z.string().min(1).max(64).optional(),
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  token: z.string().min(1).max(64),
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
