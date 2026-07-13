import Link from "next/link";

import { apiAdminProducts } from "@/lib/api";
import { formatCents } from "@gin/contracts";
import { DeleteButton } from "@/components/delete-button";

export default async function ProductsPage() {
  const products = await apiAdminProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link
          href="/products/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          New product
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Price</th>
              <th className="px-4 py-2.5">Stock</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{p.title}</span>
                  <span className="block text-xs text-neutral-400">{p.slug}</span>
                </td>
                <td className="px-4 py-2.5 text-neutral-600">{p.type}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  {formatCents(p.priceCents)}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{p.stock}</td>
                <td className="px-4 py-2.5">
                  {p.active ? (
                    <span className="text-emerald-600">Active</span>
                  ) : (
                    <span className="text-neutral-400">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/products/${p.slug}/edit`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteButton slug={p.slug} title={p.title} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
