import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";

export default function BooksLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      <div className="mt-8 flex gap-2 border-b pb-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
      <div className="mt-12">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
