import Link from "next/link";

import { apiCategories } from "@/lib/api";
import { DeleteButton } from "@/components/delete-button";
import { deleteCategoryAction } from "@/server/actions";
import { toAbsoluteImageUrl } from "@/lib/image-url";

export default async function CategoriesPage() {
  const categories = await apiCategories();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Link
          href="/categories/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          New category
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Image</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Slug</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={toAbsoluteImageUrl(c.imageUrl)}
                        alt=""
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-md bg-neutral-100" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-neutral-500">{c.slug}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/categories/${c.slug}/edit`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      itemLabel={`"${c.name}"`}
                      warning="Products in this category will become uncategorised."
                      action={deleteCategoryAction.bind(null, c.slug)}
                      successMessage={`Deleted "${c.name}".`}
                    />
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
