import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/products";
import { ProductForm, emptyProduct } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        New product
      </h1>
      <ProductForm initial={emptyProduct} categories={categories} />
    </div>
  );
}
