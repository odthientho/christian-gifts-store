import { createCategoryAction } from "@/server/actions";
import { CategoryForm } from "@/components/category-form";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New category</h1>
      <CategoryForm action={createCategoryAction} />
    </div>
  );
}
