import { db } from "@/lib/db";

// Kept out of `server/cart.ts` so that `lib/auth.ts` can call it without
// importing a "use server" module (every export there becomes an endpoint) and
// without creating an import cycle through `lib/cart.ts` -> `lib/auth.ts`.

/** Name of the httpOnly cookie holding an anonymous cart's token. */
export const CART_COOKIE = "cgs_cart";

/**
 * Fold a guest cart's lines into a user's cart, then delete the guest cart.
 *
 * Quantities are summed and clamped to available stock, so merging can never
 * create a line the user could not have added by hand. Idempotent: once the
 * guest cart is gone, later calls with the same token do nothing.
 */
export async function mergeGuestCart(
  guestToken: string,
  userCartId: string,
): Promise<void> {
  const guestCart = await db.cart.findUnique({
    where: { guestToken },
    include: { items: { include: { product: true } } },
  });

  if (!guestCart || guestCart.id === userCartId) return;

  await db.$transaction(async (tx) => {
    for (const item of guestCart.items) {
      if (!item.product.active) continue;

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: userCartId, productId: item.productId },
        },
      });

      const merged = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        item.product.stock,
      );
      if (merged <= 0) continue;

      await tx.cartItem.upsert({
        where: {
          cartId_productId: { cartId: userCartId, productId: item.productId },
        },
        create: {
          cartId: userCartId,
          productId: item.productId,
          quantity: merged,
        },
        update: { quantity: merged },
      });
    }

    // CartItem rows cascade with the cart.
    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}

/** The user's cart, created on first need. */
export async function ensureUserCart(userId: string): Promise<string> {
  const existing = await db.cart.findUnique({ where: { userId } });
  if (existing) return existing.id;
  const created = await db.cart.create({ data: { userId } });
  return created.id;
}
