import Link from "next/link";

import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/storefront/product-card";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const featured = await getFeaturedProducts(6);

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-muted/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Gifts and books for every season of faith
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Carefully chosen devotionals, study Bibles, and handmade gifts —
            for baptisms, weddings, confirmations, and quiet mornings.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/books" className={buttonVariants({ size: "lg" })}>
              Browse books
            </Link>
            <Link
              href="/gifts"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Browse gifts
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
          <Link
            href="/books"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-muted-foreground">
            No featured products yet. Run <code>npm run db:seed</code>.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
