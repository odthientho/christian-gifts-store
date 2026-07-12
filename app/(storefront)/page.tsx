import Link from "next/link";
import { ArrowRight, BookOpen, Gift, Truck } from "lucide-react";

import { getFeaturedProducts } from "@/lib/products";
import { getDictionary } from "@/lib/i18n";
import { ProductCard } from "@/components/storefront/product-card";
import { BrandSlogan } from "@/components/brand-slogan";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const [featured, dict] = await Promise.all([
    getFeaturedProducts(8),
    getDictionary(),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-ice">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_75%_at_50%_-10%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent),radial-gradient(45%_60%_at_88%_15%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
          <BrandSlogan className="mb-5 inline-block rounded-full border border-border/80 bg-background/70 px-4 py-1.5 text-xs backdrop-blur" />

          <h1 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-6xl">
            {dict.home.titleLead}{" "}
            <span className="italic text-primary">{dict.home.titleAccent}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-pretty text-muted-foreground">
            {dict.home.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/books"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-sm")}
            >
              <BookOpen className="size-4" strokeWidth={1.75} />
              {dict.home.browseBooks}
            </Link>
            <Link
              href="/gifts"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 bg-background/70 px-6 text-sm backdrop-blur",
              )}
            >
              <Gift className="size-4" strokeWidth={1.75} />
              {dict.home.browseGifts}
            </Link>
          </div>

          <p className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="size-3.5" strokeWidth={1.75} />
            {dict.home.freeShipping}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {dict.home.featured}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {dict.home.featuredSub}
            </p>
          </div>

          <Link
            href="/books"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {dict.home.viewAll}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-muted-foreground">
            No featured products yet. Run <code>npm run db:seed</code>.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} dict={dict} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
