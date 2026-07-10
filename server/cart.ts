"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CART_COOKIE } from "@/lib/cart";
import { addToCartSchema, updateCartItemSchema } from "@/lib/validations/cart";

export type ActionResult = { ok: true } | { ok: false; error: string };

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Resolve the cart to write into, creating it if needed.
 *
 * Not exported: everything in a `"use server"` module that is exported becomes
 * a callable endpoint, and this one takes no auth check of its own.
 */
async function resolveCart(): Promise<string> {
  const user = await getCurrentUser();
  const jar = await cookies();

  if (user) {
    // A signed-in user owns exactly one cart. If they had a guest cart in this
    // browser, adopt its lines so nothing is lost at sign-in.
    const existing = await db.cart.findUnique({ where: { userId: user.id } });
    if (existing) return existing.id;

    const created = await db.cart.create({ data: { userId: user.id } });
    return created.id;
  }

  const token = jar.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await db.cart.findUnique({ where: { guestToken: token } });
    if (existing) return existing.id;
  }

  const newToken = randomBytes(24).toString("hex");
  const created = await db.cart.create({ data: { guestToken: newToken } });

  jar.set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return created.id;
}

export async function addToCartAction(
  input: { productId: string; quantity: number },
): Promise<ActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const { productId, quantity } = parsed.data;

  // Read the product from the database. The client sent an id and a quantity
  // and nothing else — never a price.
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return { ok: false, error: "That product is not available." };
  }

  const cartId = await resolveCart();
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  if (desired > product.stock) {
    return {
      ok: false,
      error:
        product.stock === 0
          ? "Out of stock."
          : `Only ${product.stock} left in stock.`,
    };
  }

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity },
    update: { quantity: desired },
  });

  revalidatePath("/cart");
  revalidatePath(`/products/${product.slug}`);
  return { ok: true };
}

export async function updateCartItemAction(
  input: { productId: string; quantity: number },
): Promise<ActionResult> {
  const parsed = updateCartItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const { productId, quantity } = parsed.data;
  const cartId = await resolveCart();

  if (quantity === 0) {
    await db.cartItem.deleteMany({ where: { cartId, productId } });
    revalidatePath("/cart");
    return { ok: true };
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return { ok: false, error: "That product is not available." };
  }
  if (quantity > product.stock) {
    return { ok: false, error: `Only ${product.stock} left in stock.` };
  }

  await db.cartItem.updateMany({
    where: { cartId, productId },
    data: { quantity },
  });

  revalidatePath("/cart");
  return { ok: true };
}

export async function clearCartAction(): Promise<ActionResult> {
  const cartId = await resolveCart();
  await db.cartItem.deleteMany({ where: { cartId } });
  revalidatePath("/cart");
  return { ok: true };
}
