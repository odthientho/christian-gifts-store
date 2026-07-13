import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { getAllProductsForAdmin } from "@/lib/products";
import { formatCents } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { cn } from "@/lib/utils";
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Products
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {products.length} total ·{" "}
            {products.filter((p) => p.active).length} active
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className={cn(buttonVariants(), "h-9 gap-1.5")}
        >
          <Plus className="size-4" strokeWidth={2} />
          New product
        </Link>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">
            No products yet. Create one, or run <code>npm run db:seed</code>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
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
                  <TableCell className="max-w-xs">
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-medium hover:underline"
                    >
                      {p.title}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {p.bookDetail?.author ??
                        p.giftDetail?.material ??
                        p.type.toLowerCase()}
                    </span>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>

                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCents(p.priceCents)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        p.stock === 0
                          ? "font-medium text-destructive"
                          : p.stock <= 5
                            ? "font-medium text-brass-foreground"
                            : undefined
                      }
                    >
                      {p.stock}
                    </span>
                  </TableCell>

                  <TableCell>
                    {p.active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                        Hidden
                      </span>
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
