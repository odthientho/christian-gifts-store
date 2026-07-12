# Images — drop-in convention

Add a file with the right name in the right folder and it appears on the site.
No code change, no database edit, no reseed. Any product or section without a
matching file keeps its gradient placeholder.

Supported formats (first found wins): `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
Square images look best for products and banners; landscape for the hero.

## Products — `public/img/products/<slug>.jpg`

Name the file after the product **slug**. Recommended size: 1000×1000.

| Slug | Product |
| --- | --- |
| `mere-christianity` | Mere Christianity |
| `esv-study-bible` | ESV Study Bible |
| `the-pursuit-of-god` | The Pursuit of God |
| `my-utmost-for-his-highest` | My Utmost for His Highest |
| `the-jesus-storybook-bible` | The Jesus Storybook Bible |
| `confessions-augustine` | Confessions |
| `knowing-god` | Knowing God |
| `the-imitation-of-christ` | The Imitation of Christ |
| `olive-wood-cross-pendant` | Olive Wood Cross Pendant |
| `sterling-silver-crucifix-necklace` | Sterling Silver Crucifix Necklace |
| `engraved-wooden-prayer-box` | Engraved Wooden Prayer Box |
| `ceramic-communion-set` | Ceramic Communion Set |
| `scripture-wall-art-joshua` | Scripture Wall Art — Joshua 24:15 |
| `rosary-jerusalem-beads` | Jerusalem Stone Rosary |
| `advent-candle-wreath` | Advent Candle Wreath |
| `leather-bible-cover` | Full-Grain Leather Bible Cover |

Example: `public/img/products/mere-christianity.jpg`

To confirm the current slugs at any time:
`docker exec cgs-postgres psql -U cgs -d christian_gifts_store -c 'SELECT slug FROM "Product" ORDER BY slug;'`

## Hero — `public/img/hero/*.jpg`

Every image in this folder becomes a hero slide, in filename order, with the
Scripture verse overlaid on a dark gradient for legibility. Recommended size:
1600×900 (landscape). Name them `hero-1.jpg`, `hero-2.jpg`, … to control order.

## Category banners — `public/img/banners/<category-slug>.jpg`

The tall tile beside each category row. Recommended size: 800×1000.

`bibles` · `devotionals` · `theology` · `childrens` · `jewelry` · `home-decor` · `sacraments`

Example: `public/img/banners/jewelry.jpg`

## Promo tiles — `public/img/promo/gifts.jpg` and `public/img/promo/books.jpg`

The two tiles beside the hero. Recommended size: 800×600.

## Licensing

Only add images you have the right to use — your own photography, or stock under
a license that permits commercial use. This repository is public.
