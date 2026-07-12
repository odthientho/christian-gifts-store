import Link from "next/link";
import { ArrowRight, BookOpen, Gift } from "lucide-react";

import { getFeaturedProducts } from "@/lib/products";
import { getDictionary, getLocale } from "@/lib/i18n";
import { ProductCard } from "@/components/storefront/product-card";
import { HeroCarousel } from "@/components/storefront/hero-carousel";

export default async function HomePage() {
  const [featured, dict, locale] = await Promise.all([
    getFeaturedProducts(10),
    getDictionary(),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero: 2/3 Scripture carousel + 1/3 stacked promo tiles */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeroCarousel locale={locale} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <PromoTile
            href="/gifts"
            label={dict.home.shopGifts}
            icon={<Gift className="size-6" strokeWidth={1.5} />}
            gradient="linear-gradient(140deg, oklch(0.62 0.19 28), oklch(0.7 0.15 45))"
          />
          <PromoTile
            href="/books"
            label={dict.home.shopBooks}
            icon={<BookOpen className="size-6" strokeWidth={1.5} />}
            gradient="linear-gradient(140deg, oklch(0.4 0.09 250), oklch(0.5 0.1 210))"
          />
        </div>
      </section>

      {/* This week's picks */}
      <section className="mt-12 sm:mt-16">
        <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-primary/20 pb-3">
          <h2 className="relative font-heading text-xl font-bold uppercase tracking-wide sm:text-2xl">
            {dict.home.featuredThisWeek}
            <span className="absolute -bottom-[calc(0.75rem+2px)] left-0 h-0.5 w-24 bg-primary" />
          </h2>
          <Link
            href="/books"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} dict={dict} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PromoTile({
  href,
  label,
  icon,
  gradient,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-xl p-5 text-white lg:min-h-[8.75rem]"
      style={{ backgroundImage: gradient }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
      />
      <span className="relative grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur">
        {icon}
      </span>
      <span className="relative flex items-center gap-1.5 font-heading text-lg font-semibold">
        {label}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
