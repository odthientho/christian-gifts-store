import { notFound } from "next/navigation";

import { apiCategories } from "@/lib/api";
import { updateCategoryAction } from "@/server/actions";
import { CategoryForm } from "@/components/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await apiCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const action = updateCategoryAction.bind(null, slug);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit category</h1>
      <CategoryForm action={action} category={category} />
    </div>
  );
}
