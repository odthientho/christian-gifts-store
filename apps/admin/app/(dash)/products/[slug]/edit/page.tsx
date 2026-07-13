import { notFound } from "next/navigation";

import { apiAdminProduct, apiCategories } from "@/lib/api";
import { updateProductAction } from "@/server/actions";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([
    apiAdminProduct(slug),
    apiCategories(),
  ]);
  if (!product) notFound();

  // Bind the slug so the form action matches the (prev, formData) signature.
  const action = updateProductAction.bind(null, slug);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit product</h1>
      <ProductForm action={action} product={product} categories={categories} />
    </div>
  );
}
