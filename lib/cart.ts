import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Defined in cart-merge.ts, which has no dependency on lib/auth.ts, so that
// lib/auth.ts can read the cookie name without an import cycle.
export { CART_COOKIE } from "@/lib/cart-merge";
import { CART_COOKIE } from "@/lib/cart-merge";

/** Free shipping at or above this subtotal. Cents. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;
/** Flat rate below the threshold. Cents. */
export const FLAT_SHIPPING_CENTS = 599;

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  lineTotalCents: number;
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
};

export const EMPTY_CART: CartView = {
  id: null,
  lines: [],
  subtotalCents: 0,
  shippingCents: 0,
  totalCents: 0,
  itemCount: 0,
};

/** Shipping for a given subtotal. An empty cart never ships. */
export function shippingForSubtotal(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
    ? 0
    : FLAT_SHIPPING_CENTS;
}

/**
 * Find the current cart without creating one.
 *
 * Server Components cannot write cookies, so this never mints a guest token —
 * it only reads. The cart row and cookie are created on first add-to-cart,
 * which runs as a Server Action where cookie writes are allowed.
 */
export async function getCart(): Promise<CartView> {
  const user = await getCurrentUser();
  const jar = await cookies();
  const guestToken = jar.get(CART_COOKIE)?.value;

  if (!user && !guestToken) return EMPTY_CART;

  const cart = await db.cart.findFirst({
    where: user ? { userId: user.id } : { guestToken },
    include: {
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!cart) return EMPTY_CART;

  // Drop lines whose product was deactivated or deleted since it was added.
  const lines: CartLine[] = cart.items
    .filter((item) => item.product.active)
    .map((item) => ({
      productId: item.productId,
      slug: item.product.slug,
      title: item.product.title,
      imageUrl: item.product.imageUrl,
      unitPriceCents: item.product.priceCents,
      quantity: item.quantity,
      stock: item.product.stock,
      lineTotalCents: item.product.priceCents * item.quantity,
    }));

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const shippingCents = shippingForSubtotal(subtotalCents);

  return {
    id: cart.id,
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  };
}

/** Number of items in the cart, for the header badge. */
export async function getCartCount(): Promise<number> {
  const cart = await getCart();
  return cart.itemCount;
}
