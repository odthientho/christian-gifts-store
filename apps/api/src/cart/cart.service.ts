import { Injectable, BadRequestException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { prisma } from "@gin/db";
import {
  shippingForSubtotal,
  EMPTY_CART,
  type CartViewDTO,
  type CartLineDTO,
} from "@gin/contracts";

// A cart has one of two identities:
//   - a signed-in user's cart, found/created by userId (from the verified JWT)
//   - a guest's cart, found/created by an opaque token kept in an httpOnly
//     cookie the storefront manages
// A signed-in caller's userId always wins over any token also sent — once
// signed in, the guest cart of that same browser has already been merged in
// at login (see AuthService.login / mergeGuestCartIntoUser below) and should
// not keep being read separately.
//
// All prices and totals are computed here from the database — the client only
// ever sends a product id and a quantity, never a price.

@Injectable()
export class CartService {
  /** Read a cart. No identity at all → an empty cart; never mints on read. */
  async view(userId: string | undefined, token: string | undefined): Promise<CartViewDTO> {
    if (userId) {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true }, orderBy: { id: "asc" } } },
      });
      if (!cart) return EMPTY_CART;
      return this.toView(cart.id, null, cart.items);
    }

    if (!token) return EMPTY_CART;
    const cart = await prisma.cart.findUnique({
      where: { guestToken: token },
      include: { items: { include: { product: true }, orderBy: { id: "asc" } } },
    });
    if (!cart) return { ...EMPTY_CART, token };
    return this.toView(cart.id, token, cart.items);
  }

  async addItem(
    userId: string | undefined,
    token: string | undefined,
    productId: string,
    quantity: number,
  ): Promise<CartViewDTO> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      throw new BadRequestException("That product is not available.");
    }

    const resolved = await this.resolveCart(userId, token);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: resolved.id, productId } },
    });
    const desired = (existing?.quantity ?? 0) + quantity;
    if (desired > product.stock) {
      throw new BadRequestException(
        product.stock === 0 ? "Out of stock." : `Only ${product.stock} left in stock.`,
      );
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: resolved.id, productId } },
      create: { cartId: resolved.id, productId, quantity },
      update: { quantity: desired },
    });

    return this.viewByCartId(resolved.id, resolved.token);
  }

  async updateItem(
    userId: string | undefined,
    token: string | undefined,
    productId: string,
    quantity: number,
  ): Promise<CartViewDTO> {
    const cart = userId
      ? await prisma.cart.findUnique({ where: { userId } })
      : token
        ? await prisma.cart.findUnique({ where: { guestToken: token } })
        : null;
    if (!cart) throw new BadRequestException("Cart not found.");

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
      return this.viewByCartId(cart.id, userId ? null : (token ?? null));
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      throw new BadRequestException("That product is not available.");
    }
    if (quantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} left in stock.`);
    }

    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity },
    });
    return this.viewByCartId(cart.id, userId ? null : (token ?? null));
  }

  /**
   * Fold a guest cart's lines into a user's cart (creating the user's cart if
   * this is their first one), then delete the guest cart. Called from
   * AuthService.login. Quantities are summed and clamped to stock, so merging
   * can never create a line the user could not have added by hand.
   */
  async mergeGuestCartIntoUser(userId: string, guestToken: string): Promise<void> {
    const guestCart = await prisma.cart.findUnique({
      where: { guestToken },
      include: { items: { include: { product: true } } },
    });
    if (!guestCart) return;

    await prisma.$transaction(async (tx) => {
      const userCart =
        (await tx.cart.findUnique({ where: { userId } })) ??
        (await tx.cart.create({ data: { userId } }));

      for (const item of guestCart.items) {
        if (!item.product.active) continue;

        const existing = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
        });
        const merged = Math.min(
          (existing?.quantity ?? 0) + item.quantity,
          item.product.stock,
        );
        if (merged <= 0) continue;

        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
          create: { cartId: userCart.id, productId: item.productId, quantity: merged },
          update: { quantity: merged },
        });
      }

      // CartItem rows cascade with the cart.
      await tx.cart.delete({ where: { id: guestCart.id } });
    });
  }

  /**
   * Find the cart for this identity, or create one. `token` is only ever
   * meaningful for a guest — a signed-in cart has no client-visible token, the
   * client already holds the identity that finds it (its JWT).
   */
  private async resolveCart(
    userId: string | undefined,
    token: string | undefined,
  ): Promise<{ id: string; token: string | null }> {
    if (userId) {
      const existing = await prisma.cart.findUnique({ where: { userId } });
      if (existing) return { id: existing.id, token: null };
      const created = await prisma.cart.create({ data: { userId } });
      return { id: created.id, token: null };
    }

    if (token) {
      const existing = await prisma.cart.findUnique({ where: { guestToken: token } });
      if (existing) return { id: existing.id, token };
    }
    const newToken = randomBytes(24).toString("hex");
    const created = await prisma.cart.create({ data: { guestToken: newToken } });
    return { id: created.id, token: newToken };
  }

  private async viewByCartId(
    cartId: string,
    token: string | null,
  ): Promise<CartViewDTO> {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true },
      orderBy: { id: "asc" },
    });
    return this.toView(cartId, token, items);
  }

  private toView(
    cartId: string,
    token: string | null,
    items: {
      productId: string;
      quantity: number;
      product: {
        slug: string;
        title: string;
        imageUrl: string | null;
        priceCents: number;
        stock: number;
        active: boolean;
      };
    }[],
  ): CartViewDTO {
    // Drop lines whose product was deactivated since it was added.
    const lines: CartLineDTO[] = items
      .filter((i) => i.product.active)
      .map((i) => ({
        productId: i.productId,
        slug: i.product.slug,
        title: i.product.title,
        imageUrl: i.product.imageUrl,
        unitPriceCents: i.product.priceCents,
        quantity: i.quantity,
        stock: i.product.stock,
        lineTotalCents: i.product.priceCents * i.quantity,
      }));

    const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
    const shippingCents = shippingForSubtotal(subtotalCents);
    return {
      id: cartId,
      token,
      lines,
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    };
  }
}
