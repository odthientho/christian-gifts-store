import Link from "next/link";
import { ArrowRight, BookOpen, Gift, Truck } from "lucide-react";

import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/storefront/product-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const featured = await getFeaturedProducts(6);

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        {/* Two soft light sources rather than a flat grey band. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_-10%,color-mix(in_oklch,var(--primary)_11%,transparent),transparent),radial-gradient(40%_60%_at_85%_10%,color-mix(in_oklch,var(--brass)_16%,transparent),transparent)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-brass" />
            Handmade gifts &amp; carefully chosen books
          </p>

          <h1 className="font-heading text-balance text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl">
            Gifts and books for every{" "}
            <span className="italic text-primary">season of faith</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Devotionals, study Bibles, and handmade gifts — for baptisms,
            weddings, confirmations, and quiet mornings.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/books"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-sm")}
            >
              <BookOpen className="size-4" strokeWidth={1.75} />
              Browse books
            </Link>
            <Link
              href="/gifts"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 bg-background/70 px-6 text-sm backdrop-blur",
              )}
            >
              <Gift className="size-4" strokeWidth={1.75} />
              Browse gifts
            </Link>
          </div>

          <p className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="size-3.5" strokeWidth={1.75} />
            Free shipping on orders over $50
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Featured
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A few things worth keeping.
            </p>
          </div>

          <Link
            href="/books"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-muted-foreground">
            No featured products yet. Run <code>npm run db:seed</code>.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
