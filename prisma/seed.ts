import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const CATEGORIES = [
  { slug: "bibles", name: "Bibles" },
  { slug: "devotionals", name: "Devotionals" },
  { slug: "theology", name: "Theology" },
  { slug: "childrens", name: "Children's" },
  { slug: "jewelry", name: "Jewelry" },
  { slug: "home-decor", name: "Home & Decor" },
  { slug: "sacraments", name: "Sacraments" },
];

type BookSeed = {
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  featured?: boolean;
  book: {
    author: string;
    publisher?: string;
    pageCount?: number;
    format: "HARDCOVER" | "PAPERBACK" | "EBOOK" | "AUDIOBOOK";
    isbn?: string;
  };
};

type GiftSeed = {
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  featured?: boolean;
  gift: {
    material?: string;
    dimensions?: string;
    occasion?: string;
    handmade?: boolean;
  };
};

const BOOKS: BookSeed[] = [
  {
    slug: "mere-christianity",
    title: "Mere Christianity",
    description:
      "C. S. Lewis's classic case for the Christian faith, drawn from his wartime radio talks. A clear, generous introduction to what Christians across traditions hold in common.",
    priceCents: 1599,
    stock: 40,
    category: "theology",
    featured: true,
    book: {
      author: "C. S. Lewis",
      publisher: "HarperOne",
      pageCount: 227,
      format: "PAPERBACK",
      isbn: "978-0060652920",
    },
  },
  {
    slug: "esv-study-bible",
    title: "ESV Study Bible",
    description:
      "The English Standard Version with more than 20,000 study notes, 200 full-color maps and charts, and book introductions. Bound in hardcover for daily use.",
    priceCents: 4999,
    stock: 25,
    category: "bibles",
    featured: true,
    book: {
      author: "Crossway",
      publisher: "Crossway",
      pageCount: 2752,
      format: "HARDCOVER",
      isbn: "978-1433502415",
    },
  },
  {
    slug: "the-pursuit-of-god",
    title: "The Pursuit of God",
    description:
      "A. W. Tozer's enduring call to know God personally rather than merely to know about Him. Short chapters, each closing in prayer.",
    priceCents: 1099,
    stock: 60,
    category: "devotionals",
    book: {
      author: "A. W. Tozer",
      publisher: "Moody Publishers",
      pageCount: 128,
      format: "PAPERBACK",
      isbn: "978-1600661365",
    },
  },
  {
    slug: "my-utmost-for-his-highest",
    title: "My Utmost for His Highest",
    description:
      "Oswald Chambers's daily devotional, compiled from his lectures. One reading for every day of the year, updated in modern English.",
    priceCents: 1799,
    stock: 35,
    category: "devotionals",
    featured: true,
    book: {
      author: "Oswald Chambers",
      publisher: "Discovery House",
      pageCount: 416,
      format: "HARDCOVER",
      isbn: "978-1627079174",
    },
  },
  {
    slug: "the-jesus-storybook-bible",
    title: "The Jesus Storybook Bible",
    description:
      "Every story whispers His name. Sally Lloyd-Jones retells 44 Bible stories for children, showing how each one points to Jesus. Illustrated throughout.",
    priceCents: 1899,
    stock: 50,
    category: "childrens",
    featured: true,
    book: {
      author: "Sally Lloyd-Jones",
      publisher: "Zondervan",
      pageCount: 352,
      format: "HARDCOVER",
      isbn: "978-0310708254",
    },
  },
  {
    slug: "confessions-augustine",
    title: "Confessions",
    description:
      "Augustine's fourth-century spiritual autobiography and prayer, and the first true autobiography in Western literature. Henry Chadwick's translation.",
    priceCents: 1299,
    stock: 30,
    category: "theology",
    book: {
      author: "Augustine of Hippo",
      publisher: "Oxford University Press",
      pageCount: 352,
      format: "PAPERBACK",
      isbn: "978-0199537822",
    },
  },
  {
    slug: "knowing-god",
    title: "Knowing God",
    description:
      "J. I. Packer's study of the attributes of God and what it means to be known by Him. Widely regarded as a modern devotional classic.",
    priceCents: 1699,
    stock: 28,
    category: "theology",
    book: {
      author: "J. I. Packer",
      publisher: "IVP Books",
      pageCount: 286,
      format: "PAPERBACK",
      isbn: "978-0830816507",
    },
  },
  {
    slug: "the-imitation-of-christ",
    title: "The Imitation of Christ",
    description:
      "Thomas à Kempis's fifteenth-century handbook of the interior life. After the Bible, among the most widely read Christian devotional works.",
    priceCents: 999,
    stock: 45,
    category: "devotionals",
    book: {
      author: "Thomas à Kempis",
      publisher: "Dover Publications",
      pageCount: 240,
      format: "PAPERBACK",
      isbn: "978-0486431857",
    },
  },
];

const GIFTS: GiftSeed[] = [
  {
    slug: "olive-wood-cross-pendant",
    title: "Olive Wood Cross Pendant",
    description:
      "Hand-carved from Bethlehem olive wood and finished with natural oil. Hangs on an adjustable waxed cord. No two pieces share the same grain.",
    priceCents: 2400,
    stock: 40,
    category: "jewelry",
    featured: true,
    gift: {
      material: "Bethlehem olive wood",
      dimensions: '1.5" x 1" pendant, 20" adjustable cord',
      occasion: "Confirmation",
      handmade: true,
    },
  },
  {
    slug: "sterling-silver-crucifix-necklace",
    title: "Sterling Silver Crucifix Necklace",
    description:
      "A .925 sterling silver crucifix on an 18-inch box chain, presented in a lined gift box. Tarnish-resistant finish.",
    priceCents: 5900,
    stock: 22,
    category: "jewelry",
    featured: true,
    gift: {
      material: ".925 sterling silver",
      dimensions: '1.25" crucifix, 18" chain',
      occasion: "Baptism",
    },
  },
  {
    slug: "engraved-wooden-prayer-box",
    title: "Engraved Wooden Prayer Box",
    description:
      "A hinged walnut box for written prayers and intentions, engraved with Philippians 4:6. Felt-lined interior.",
    priceCents: 3450,
    stock: 18,
    category: "home-decor",
    gift: {
      material: "Solid walnut",
      dimensions: '6" x 4" x 3"',
      occasion: "Wedding",
      handmade: true,
    },
  },
  {
    slug: "ceramic-communion-set",
    title: "Ceramic Communion Set",
    description:
      "A stoneware paten and chalice, glazed in matte white and fired at high temperature. Dishwasher safe and suitable for home or small-chapel use.",
    priceCents: 8900,
    stock: 12,
    category: "sacraments",
    gift: {
      material: "Glazed stoneware",
      dimensions: 'Chalice 5" tall, paten 7" diameter',
      occasion: "Ordination",
      handmade: true,
    },
  },
  {
    slug: "scripture-wall-art-joshua",
    title: "Scripture Wall Art — Joshua 24:15",
    description:
      '"As for me and my house, we will serve the Lord." Letterpress-printed on cotton paper and framed in solid oak.',
    priceCents: 4200,
    stock: 20,
    category: "home-decor",
    featured: true,
    gift: {
      material: "Cotton paper, oak frame",
      dimensions: '12" x 16" framed',
      occasion: "Housewarming",
    },
  },
  {
    slug: "rosary-jerusalem-beads",
    title: "Jerusalem Stone Rosary",
    description:
      "Five decades of Jerusalem limestone beads strung on stainless steel wire, with a pewter crucifix and centerpiece. Arrives in a drawstring pouch.",
    priceCents: 3600,
    stock: 30,
    category: "sacraments",
    gift: {
      material: "Jerusalem limestone, pewter",
      dimensions: '19" loop',
      occasion: "First Communion",
      handmade: true,
    },
  },
  {
    slug: "advent-candle-wreath",
    title: "Advent Candle Wreath",
    description:
      "A cast-iron wreath holding four taper candles and one center pillar, for marking the Sundays of Advent. Candles included.",
    priceCents: 5400,
    stock: 15,
    category: "home-decor",
    gift: {
      material: "Cast iron",
      dimensions: '14" diameter',
      occasion: "Christmas",
    },
  },
  {
    slug: "leather-bible-cover",
    title: "Full-Grain Leather Bible Cover",
    description:
      "Full-grain leather with a pen loop, ribbon marker slot, and hand-stitched edges. Sized for most standard study Bibles. Softens with use.",
    priceCents: 6500,
    stock: 24,
    category: "home-decor",
    gift: {
      material: "Full-grain leather",
      dimensions: 'Fits up to 9.5" x 6.5" x 2"',
      occasion: "Graduation",
      handmade: true,
    },
  },
];

async function main() {
  console.log("Seeding…");

  // Categories
  for (const c of CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name },
    });
  }
  const categoryBySlug = new Map(
    (await db.category.findMany()).map((c) => [c.slug, c.id]),
  );
  console.log(`  ${CATEGORIES.length} categories`);

  // Books
  for (const b of BOOKS) {
    const { book, category, ...rest } = b;
    await db.product.upsert({
      where: { slug: b.slug },
      update: {
        ...rest,
        type: "BOOK",
        categoryId: categoryBySlug.get(category),
        bookDetail: { update: book },
      },
      create: {
        ...rest,
        type: "BOOK",
        categoryId: categoryBySlug.get(category),
        bookDetail: { create: book },
      },
    });
  }
  console.log(`  ${BOOKS.length} books`);

  // Gifts
  for (const g of GIFTS) {
    const { gift, category, ...rest } = g;
    await db.product.upsert({
      where: { slug: g.slug },
      update: {
        ...rest,
        type: "GIFT",
        categoryId: categoryBySlug.get(category),
        giftDetail: { update: gift },
      },
      create: {
        ...rest,
        type: "GIFT",
        categoryId: categoryBySlug.get(category),
        giftDetail: { create: gift },
      },
    });
  }
  console.log(`  ${GIFTS.length} gifts`);

  // Admin user
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name: "Store Admin", role: "ADMIN", passwordHash },
  });
  console.log(`  admin: ${email}`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
