import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { getAllProductsForAdmin } from "@/lib/products";
import { formatCents } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getAllProductsForAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">
          No products yet. Create one, or run <code>npm run db:seed</code>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/products/${p.slug}`}
                      className="hover:underline"
                    >
                      {p.title}
                    </Link>
                    {p.bookDetail && (
                      <span className="block text-xs text-muted-foreground">
                        {p.bookDetail.author}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCents(p.priceCents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        p.stock === 0
                          ? "text-destructive"
                          : p.stock <= 5
                            ? "text-amber-600"
                            : undefined
                      }
                    >
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} title={p.title} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
