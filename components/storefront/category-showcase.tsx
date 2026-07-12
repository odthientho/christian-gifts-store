import Link from "next/link";
import { ArrowRight, BookOpen, Gift } from "lucide-react";

import { ProductCard, type CardProduct } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import { translateCategory, type Dictionary } from "@/lib/i18n";
import { bannerImage } from "@/lib/site-images";

export type Showcase = {
  id: string;
  slug: string;
  name: string;
  type: "BOOK" | "GIFT";
  products: CardProduct[];
};

// A gradient per showcase so stacked sections don't all look identical. Keyed by
// index, cycled — stands in for category photography.
const BANNER_GRADIENTS = [
  "linear-gradient(150deg, oklch(0.4 0.09 250), oklch(0.5 0.1 215))",
  "linear-gradient(150deg, oklch(0.45 0.08 160), oklch(0.55 0.09 190))",
  "linear-gradient(150deg, oklch(0.5 0.14 40), oklch(0.62 0.16 55))",
  "linear-gradient(150deg, oklch(0.42 0.1 300), oklch(0.5 0.12 330))",
];

/**
 * A category section: a tall banner tile on the left linking to the category,
 * and a row of that category's newest products on the right. Mirrors the
 * reference homepage's "Đồ Gia Dụng / Đồ Trang Trí / …" blocks.
 */
export function CategoryShowcase({
  showcase,
  index,
  dict,
}: {
  showcase: Showcase;
  index: number;
  dict: Dictionary;
}) {
  const basePath = showcase.type === "BOOK" ? "/books" : "/gifts";
  const href = `${basePath}?category=${showcase.slug}`;
  const label = translateCategory(dict, showcase.slug, showcase.name);
  const Icon = showcase.type === "BOOK" ? BookOpen : Gift;

  // A photo in /public/img/banners/<slug>.jpg sits under a dark tint; otherwise
  // the cycling gradient placeholder.
  const photo = bannerImage(showcase.slug);
  const bannerBg = photo
    ? `linear-gradient(150deg, oklch(0.28 0.05 265 / 0.72), oklch(0.35 0.06 250 / 0.55)), url(${photo})`
    : BANNER_GRADIENTS[index % BANNER_GRADIENTS.length];

  return (
    <section className="mt-12 sm:mt-16">
      <SectionHeading title={label} href={href} viewAllLabel={dict.home.viewCategory} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_1fr]">
        <Link
          href={href}
          className="group relative hidden min-h-56 flex-col justify-between overflow-hidden rounded-xl bg-cover bg-center p-5 text-white lg:flex"
          style={{ backgroundImage: bannerBg }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
          />
          <span className="relative grid size-11 place-items-center rounded-full bg-white/20 backdrop-blur">
            <Icon className="size-6" strokeWidth={1.5} />
          </span>
          <span className="relative">
            <span className="block font-heading text-xl font-semibold">
              {label}
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/85">
              {dict.home.viewCategory}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {showcase.products.map((p) => (
            <ProductCard key={p.id} product={p} dict={dict} />
          ))}
        </div>
      </div>
    </section>
  );
}
