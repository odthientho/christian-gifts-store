"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Build the nested detail write for whichever product type this is. */
function detailWrite(input: ProductInput) {
  return input.type === "BOOK"
    ? { bookDetail: { create: input.book }, giftDetail: undefined }
    : { giftDetail: { create: input.gift }, bookDetail: undefined };
}

function baseWrite(input: ProductInput) {
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    type: input.type,
    priceCents: input.priceDollars, // already transformed to cents by Zod
    imageUrl: input.imageUrl ?? null,
    stock: input.stock,
    active: input.active,
    featured: input.featured,
    categoryId: input.categoryId ?? null,
  };
}

export async function createProductAction(
  raw: unknown,
): Promise<SaveResult> {
  // Authorization first, on every action. The admin layout also gates, but a
  // Server Action is a public endpoint reachable without ever rendering it.
  await requireAdmin();

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error.issues) };
  }
  const input = parsed.data;

  const clash = await db.product.findUnique({ where: { slug: input.slug } });
  if (clash) return { ok: false, error: "That slug is already in use." };

  const product = await db.product.create({
    data: { ...baseWrite(input), ...detailWrite(input) },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, id: product.id };
}

export async function updateProductAction(
  id: string,
  raw: unknown,
): Promise<SaveResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error.issues) };
  }
  const input = parsed.data;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Product not found." };

  const clash = await db.product.findUnique({ where: { slug: input.slug } });
  if (clash && clash.id !== id) {
    return { ok: false, error: "That slug is already in use." };
  }

  // Changing a product's type must not leave the old detail row behind.
  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: baseWrite(input) });

    if (input.type === "BOOK") {
      await tx.giftDetail.deleteMany({ where: { productId: id } });
      await tx.bookDetail.upsert({
        where: { productId: id },
        create: { productId: id, ...input.book },
        update: input.book,
      });
    } else {
      await tx.bookDetail.deleteMany({ where: { productId: id } });
      await tx.giftDetail.upsert({
        where: { productId: id },
        create: { productId: id, ...input.gift },
        update: input.gift,
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${input.slug}`);
  revalidatePath("/");
  return { ok: true, id };
}

export async function deleteProductAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const existing = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) return { ok: false, error: "Product not found." };

  // A product that appears on a past order is soft-deleted. Hard-deleting it
  // would blank the product link on that order's history.
  if (existing._count.orderItems > 0) {
    await db.product.update({ where: { id }, data: { active: false } });
  } else {
    await db.product.delete({ where: { id } });
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true };
}

const ALLOWED_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
];

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  if (!ALLOWED_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: "Unknown status." };
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });

  revalidatePath("/admin/orders");
  return { ok: true };
}

function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Invalid input.";
}
