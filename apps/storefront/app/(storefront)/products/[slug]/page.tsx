import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Gift, Truck, ChevronRight } from "lucide-react";

import { getProductBySlug } from "@/lib/products";
import { formatCents } from "@/lib/money";
import {
  getDictionary,
  interpolate,
  translateCategory,
  type Dictionary,
} from "@/lib/i18n";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Separator } from "@/components/ui/separator";
import { productImage } from "@/lib/site-images";
import { toAbsoluteImageUrl } from "@/lib/image-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, dict] = await Promise.all([
    getProductBySlug(slug),
    getDictionary(),
  ]);

  if (!product) notFound();

  const soldOut = product.stock <= 0;
  const isBook = product.type === "BOOK";
  const Icon = isBook ? BookOpen : Gift;
  const image =
    productImage(product.slug) ??
    (product.imageUrl ? toAbsoluteImageUrl(product.imageUrl) : null);
  const backHref = isBook ? "/books" : "/gifts";
  const backLabel = isBook ? dict.catalog.booksTitle : dict.catalog.giftsTitle;

  const specs: [string, string][] = [];
  if (product.bookDetail) {
    const b = product.bookDetail;
    specs.push([dict.specs.author, b.author]);
    if (b.publisher) specs.push([dict.specs.publisher, b.publisher]);
    if (b.pageCount) specs.push([dict.specs.pages, String(b.pageCount)]);
    specs.push([dict.specs.format, titleCase(b.format)]);
    specs.push([dict.specs.language, b.language]);
    if (b.isbn) specs.push([dict.specs.isbn, b.isbn]);
  }
  if (product.giftDetail) {
    const g = product.giftDetail;
    if (g.material) specs.push([dict.specs.material, g.material]);
    if (g.dimensions) specs.push([dict.specs.dimensions, g.dimensions]);
    if (g.occasion) specs.push([dict.specs.occasion, g.occasion]);
    if (g.handmade) specs.push([dict.specs.handmade, dict.specs.yes]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          {dict.product.home}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={backHref} className="hover:text-foreground">
          {backLabel}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-2xl border bg-card">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={product.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="product-placeholder grid size-full place-items-center">
                <Icon
                  className="size-24 text-primary/30"
                  strokeWidth={0.9}
                  aria-hidden
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {product.category && (
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/80">
              {translateCategory(
                dict,
                product.category.slug,
                product.category.name,
              )}
            </p>
          )}

          <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            {product.title}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">
              {formatCents(product.priceCents)}
            </span>
            <StockPill stock={product.stock} dict={dict} />
          </div>

          <p className="mt-6 leading-relaxed text-pretty text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToCartButton
              productId={product.id}
              disabled={soldOut}
              labels={{
                add: dict.product.addToCart,
                adding: dict.product.adding,
                soldOut: dict.product.soldOut,
                quantity: dict.product.quantity,
                added: dict.product.addToCart,
              }}
            />
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4" strokeWidth={1.75} />
            {dict.product.freeShipping}
          </p>

          {specs.length > 0 && (
            <>
              <Separator className="my-9" />
              <h2 className="font-heading text-lg font-semibold">
                {dict.product.details}
              </h2>
              <dl className="mt-4 divide-y rounded-xl border bg-card">
                {specs.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-6 px-4 py-3 text-sm"
                  >
                    <dt className="shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** `PAPERBACK` -> `Paperback`. Only for enum values, never for free text. */
function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function StockPill({ stock, dict }: { stock: number; dict: Dictionary }) {
  if (stock <= 0) {
    return (
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        {dict.product.outOfStock}
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="rounded-full bg-brass/25 px-2.5 py-1 text-xs font-medium text-brass-foreground">
        {interpolate(dict.product.onlyLeft, { n: stock })}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {dict.product.inStock}
    </span>
  );
}
