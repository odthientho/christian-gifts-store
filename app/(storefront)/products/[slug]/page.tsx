import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Gift, Truck, ChevronRight } from "lucide-react";

import { getProductBySlug } from "@/lib/products";
import { formatCents } from "@/lib/money";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Separator } from "@/components/ui/separator";

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
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const soldOut = product.stock <= 0;
  const isBook = product.type === "BOOK";
  const Icon = isBook ? BookOpen : Gift;
  const backHref = isBook ? "/books" : "/gifts";

  const specs: [string, string][] = [];
  if (product.bookDetail) {
    const b = product.bookDetail;
    specs.push(["Author", b.author]);
    if (b.publisher) specs.push(["Publisher", b.publisher]);
    if (b.pageCount) specs.push(["Pages", String(b.pageCount)]);
    // Title-case the enum here rather than with a `capitalize` class on the
    // value cell — that class would also rewrite author-supplied text like
    // `1.5" x 1" pendant` into `1.5" X 1" Pendant`.
    specs.push(["Format", titleCase(b.format)]);
    specs.push(["Language", b.language]);
    if (b.isbn) specs.push(["ISBN", b.isbn]);
  }
  if (product.giftDetail) {
    const g = product.giftDetail;
    if (g.material) specs.push(["Material", g.material]);
    if (g.dimensions) specs.push(["Dimensions", g.dimensions]);
    if (g.occasion) specs.push(["Occasion", g.occasion]);
    if (g.handmade) specs.push(["Handmade", "Yes"]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={backHref} className="hover:text-foreground">
          {isBook ? "Books" : "Gifts"}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-2xl border bg-card">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
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
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {product.category.name}
            </p>
          )}

          <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {product.title}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">
              {formatCents(product.priceCents)}
            </span>
            <StockPill stock={product.stock} />
          </div>

          <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToCartButton productId={product.id} disabled={soldOut} />
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4" strokeWidth={1.75} />
            Free shipping on orders over $50
          </p>

          {specs.length > 0 && (
            <>
              <Separator className="my-9" />
              <h2 className="font-heading text-lg font-semibold">Details</h2>
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

function StockPill({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        Out of stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="rounded-full bg-brass/25 px-2.5 py-1 text-xs font-medium text-brass-foreground">
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      In stock
    </span>
  );
}
