import { Injectable, BadRequestException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { prisma } from "@gin/db";
import {
  shippingForSubtotal,
  EMPTY_CART,
  type CartViewDTO,
  type CartLineDTO,
} from "@gin/contracts";

// The cart is identified by an opaque token the storefront keeps in an httpOnly
// cookie. All prices and totals are computed here from the database — the client
// only ever sends a product id and a quantity, never a price.

@Injectable()
export class CartService {
  /** Read a cart by token. Unknown or missing token → an empty cart. */
  async view(token: string | undefined): Promise<CartViewDTO> {
    if (!token) return EMPTY_CART;
    const cart = await prisma.cart.findUnique({
      where: { guestToken: token },
      include: {
        items: { include: { product: true }, orderBy: { id: "asc" } },
      },
    });
    if (!cart) return { ...EMPTY_CART, token };
    return this.toView(cart.id, token, cart.items);
  }

  async addItem(
    token: string | undefined,
    productId: string,
    quantity: number,
  ): Promise<CartViewDTO> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      throw new BadRequestException("That product is not available.");
    }

    const { id: cartId, token: cartToken } = await this.resolveCart(token);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });
    const desired = (existing?.quantity ?? 0) + quantity;
    if (desired > product.stock) {
      throw new BadRequestException(
        product.stock === 0 ? "Out of stock." : `Only ${product.stock} left in stock.`,
      );
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: desired },
    });

    return this.viewByCartId(cartId, cartToken);
  }

  async updateItem(
    token: string,
    productId: string,
    quantity: number,
  ): Promise<CartViewDTO> {
    const cart = await prisma.cart.findUnique({ where: { guestToken: token } });
    if (!cart) throw new BadRequestException("Cart not found.");

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
      return this.viewByCartId(cart.id, token);
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
    return this.viewByCartId(cart.id, token);
  }

  /** Find the cart for a token, or mint a new guest cart + token. */
  private async resolveCart(
    token: string | undefined,
  ): Promise<{ id: string; token: string }> {
    if (token) {
      const existing = await prisma.cart.findUnique({
        where: { guestToken: token },
      });
      if (existing) return { id: existing.id, token };
    }
    const newToken = randomBytes(24).toString("hex");
    const created = await prisma.cart.create({
      data: { guestToken: newToken },
    });
    return { id: created.id, token: newToken };
  }

  private async viewByCartId(cartId: string, token: string): Promise<CartViewDTO> {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true },
      orderBy: { id: "asc" },
    });
    return this.toView(cartId, token, items);
  }

  private toView(
    cartId: string,
    token: string,
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
