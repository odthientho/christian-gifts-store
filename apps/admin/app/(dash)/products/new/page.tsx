import { apiCategories } from "@/lib/api";
import { createProductAction } from "@/server/actions";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage() {
  const categories = await apiCategories();
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New product</h1>
      <ProductForm action={createProductAction} categories={categories} />
    </div>
  );
}
