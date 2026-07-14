import type { ProductDTO } from "@gin/contracts";

// The Prisma row shape we select for a product. Kept loose on purpose: the
// mapper is the one place the DB shape is turned into the wire contract, so the
// rest of the app depends on ProductDTO, not on Prisma.
type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
  category: { id: string; slug: string; name: string; imageUrl: string | null } | null;
  bookDetail: {
    author: string;
    isbn: string | null;
    publisher: string | null;
    pageCount: number | null;
    language: string;
    format: string;
  } | null;
  giftDetail: {
    material: string | null;
    dimensions: string | null;
    occasion: string | null;
    handmade: boolean;
  } | null;
};

export function toProductDTO(row: ProductRow): ProductDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.type === "BOOK" ? "BOOK" : "GIFT",
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    stock: row.stock,
    active: row.active,
    featured: row.featured,
    category: row.category,
    bookDetail: row.bookDetail,
    giftDetail: row.giftDetail,
  };
}

/** The Prisma include used everywhere a full product is returned. */
export const productInclude = {
  category: true,
  bookDetail: {
    select: {
      author: true,
      isbn: true,
      publisher: true,
      pageCount: true,
      language: true,
      format: true,
    },
  },
  giftDetail: {
    select: {
      material: true,
      dimensions: true,
      occasion: true,
      handmade: true,
    },
  },
} as const;
