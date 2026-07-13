import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { getCategories, getProductForAdmin } from "@/lib/products";
import { centsToDollars } from "@/lib/money";
import {
  ProductForm,
  emptyProduct,
  type ProductFormValues,
} from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    getCategories(),
  ]);

  if (!product) notFound();

  const initial: ProductFormValues = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    type: product.type,
    priceDollars: String(centsToDollars(product.priceCents)),
    imageUrl: product.imageUrl ?? "",
    stock: String(product.stock),
    active: product.active,
    featured: product.featured,
    categoryId: product.categoryId ?? "",
    book: product.bookDetail
      ? {
          author: product.bookDetail.author,
          isbn: product.bookDetail.isbn ?? "",
          publisher: product.bookDetail.publisher ?? "",
          pageCount: product.bookDetail.pageCount
            ? String(product.bookDetail.pageCount)
            : "",
          language: product.bookDetail.language,
          format: product.bookDetail.format,
        }
      : emptyProduct.book,
    gift: product.giftDetail
      ? {
          material: product.giftDetail.material ?? "",
          dimensions: product.giftDetail.dimensions ?? "",
          occasion: product.giftDetail.occasion ?? "",
          handmade: product.giftDetail.handmade,
        }
      : emptyProduct.gift,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        Edit product
      </h1>
      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
