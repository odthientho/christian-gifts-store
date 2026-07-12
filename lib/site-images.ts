import fs from "node:fs";
import path from "node:path";

// Convention-over-configuration image resolver. Drop a file into the right
// folder under /public/img and it appears — no database change, no code edit,
// no reseed. Missing files fall back to the gradient placeholders.
//
// This reads the filesystem at render time. The storefront is dynamically
// rendered (it reads the locale cookie), so a cheap existsSync per request is
// fine at this scale. It imports node:fs, so only import it from Server
// Components — a client import fails to bundle, which is the guard we want.

const PUBLIC_DIR = path.join(process.cwd(), "public");
const EXTS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

/** Return the public URL for `img/<relNoExt>.<ext>` if any extension exists. */
function firstExisting(relNoExt: string): string | null {
  for (const ext of EXTS) {
    const rel = `img/${relNoExt}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC_DIR, rel))) return `/${rel}`;
  }
  return null;
}

/** Photo for a product: /public/img/products/<slug>.jpg (or .png/.webp/…). */
export function productImage(slug: string): string | null {
  return firstExisting(`products/${slug}`);
}

/** Photo for a category banner: /public/img/banners/<category-slug>.jpg. */
export function bannerImage(slug: string): string | null {
  return firstExisting(`banners/${slug}`);
}

/** Photo for a promo tile: /public/img/promo/gifts.jpg, /promo/books.jpg. */
export function promoImage(name: string): string | null {
  return firstExisting(`promo/${name}`);
}

/**
 * All hero slide photos in /public/img/hero, sorted by name (hero-1, hero-2, …).
 * Empty when the folder has none, in which case the carousel keeps its gradients.
 */
export function heroImages(): string[] {
  const dir = path.join(PUBLIC_DIR, "img/hero");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => EXTS.includes(f.split(".").pop()?.toLowerCase() as never))
    .sort()
    .map((f) => `/img/hero/${f}`);
}
