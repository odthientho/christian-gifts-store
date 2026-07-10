import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductBySlug } from "@/lib/products";
import { formatCents } from "@/lib/money";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = { params: Promise<{ slug: string }> };

// `params` is a Promise in Next.js 16.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return { title: product.title, description: product.description.slice(0, 160) };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const soldOut = product.stock <= 0;

  const specs: [string, string][] = [];
  if (product.bookDetail) {
    const b = product.bookDetail;
    specs.push(["Author", b.author]);
    if (b.publisher) specs.push(["Publisher", b.publisher]);
    if (b.pageCount) specs.push(["Pages", String(b.pageCount)]);
    specs.push(["Format", b.format.toLowerCase()]);
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
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <span className="text-8xl opacity-30">
              {product.type === "BOOK" ? "📖" : "🎁"}
            </span>
          </div>
        )}
      </div>

      <div>
        {product.category && (
          <Badge variant="secondary" className="mb-3">
            {product.category.name}
          </Badge>
        )}

        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {product.title}
        </h1>

        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {formatCents(product.priceCents)}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {soldOut
            ? "Currently out of stock"
            : product.stock <= 5
              ? `Only ${product.stock} left in stock`
              : "In stock"}
        </p>

        <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-8">
          <AddToCartButton productId={product.id} disabled={soldOut} />
        </div>

        {specs.length > 0 && (
          <>
            <Separator className="my-8" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
