import Link from "next/link";
import { ArrowRight, BookOpen, Gift } from "lucide-react";

import {
  getFeaturedProducts,
  getNewProducts,
  getCategoryShowcases,
} from "@/lib/products";
import { getDictionary, getLocale } from "@/lib/i18n";
import { heroImages, promoImage } from "@/lib/site-images";
import { ProductCard } from "@/components/storefront/product-card";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { SectionHeading } from "@/components/storefront/section-heading";
import { CategoryShowcase } from "@/components/storefront/category-showcase";

export default async function HomePage() {
  const [featured, newArrivals, showcases, dict, locale] = await Promise.all([
    getFeaturedProducts(5),
    getNewProducts(10),
    getCategoryShowcases(4),
    getDictionary(),
    getLocale(),
  ]);

  // Optional photos, resolved from /public/img at render. Absent → gradients.
  const hero = heroImages();
  const giftsPromo = promoImage("gifts");
  const booksPromo = promoImage("books");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero: 2/3 Scripture carousel + 1/3 stacked promo tiles */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeroCarousel locale={locale} images={hero} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <PromoTile
            href="/gifts"
            label={dict.home.shopGifts}
            icon={<Gift className="size-6" strokeWidth={1.5} />}
            image={giftsPromo}
            gradient="linear-gradient(140deg, oklch(0.62 0.19 28), oklch(0.7 0.15 45))"
          />
          <PromoTile
            href="/books"
            label={dict.home.shopBooks}
            icon={<BookOpen className="size-6" strokeWidth={1.5} />}
            image={booksPromo}
            gradient="linear-gradient(140deg, oklch(0.4 0.09 250), oklch(0.5 0.1 210))"
          />
        </div>
      </section>

      {/* This week's picks */}
      {featured.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <SectionHeading
            title={dict.home.featuredThisWeek}
            href="/books"
            viewAllLabel={dict.home.viewAll}
          />
          <ProductRow products={featured} dict={dict} />
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <SectionHeading title={dict.home.newProducts} viewAllLabel={dict.home.viewAll} />
          <ProductRow products={newArrivals} dict={dict} />
        </section>
      )}

      {/* One showcase per category: banner + product row */}
      {showcases.map((s, i) => (
        <CategoryShowcase key={s.id} showcase={s} index={i} dict={dict} />
      ))}
    </div>
  );
}

function ProductRow({
  products,
  dict,
}: {
  products: React.ComponentProps<typeof ProductCard>["product"][];
  dict: React.ComponentProps<typeof ProductCard>["dict"];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} dict={dict} />
      ))}
    </div>
  );
}

function PromoTile({
  href,
  label,
  icon,
  gradient,
  image,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  // A photo in /public/img/promo/<name>.jpg. When present it sits under a tinted
  // version of the gradient so the label stays legible; otherwise plain gradient.
  image?: string | null;
}) {
  const tinted = gradient.replace(/oklch\(([^)]+)\)/g, "oklch($1 / 0.82)");
  return (
    <Link
      href={href}
      className="group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-xl bg-cover bg-center p-5 text-white lg:min-h-[8.75rem]"
      style={{
        backgroundImage: image ? `${tinted}, url(${image})` : gradient,
      }}
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
