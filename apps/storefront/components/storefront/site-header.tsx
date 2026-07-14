import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/products";
import { getDictionary, getLocale, translateCategory } from "@/lib/i18n";
import { BRAND_NAME } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { SearchBar } from "@/components/storefront/search-bar";
import { CategoryMenu } from "@/components/storefront/category-menu";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [count, user, dict, locale, bookCats, giftCats] = await Promise.all([
    getCartCount(),
    getCurrentUser(),
    getDictionary(),
    getLocale(),
    getCategories("BOOK"),
    getCategories("GIFT"),
  ]);

  const translate = (cats: { slug: string; name: string }[]) =>
    cats.map((c) => ({
      slug: c.slug,
      name: translateCategory(dict, c.slug, c.name),
    }));

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      {/* Row 1 — brand, search, account, cart */}
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0">
            <span className="block font-heading text-2xl font-bold leading-none tracking-tight text-primary">
              {BRAND_NAME}
            </span>
            <span className="mt-1 block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Growing · Inspiring · Nurturing
            </span>
          </Link>

          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <div className="mx-auto max-w-xl">
              <SearchBar
                placeholder={dict.nav.searchPlaceholder}
                label={dict.nav.search}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            <LocaleToggle locale={locale} />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Link
                  href="/orders"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  {dict.nav.myOrders}
                </Link>
                <SignOutButton label={dict.nav.signOut} />
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                {dict.nav.signIn}
              </Link>
            )}

            <Link
              href="/cart"
              aria-label={dict.nav.cartLabel}
              className="relative flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/70"
            >
              <ShoppingBag className="size-5 text-primary" strokeWidth={1.75} />
              <span className="hidden md:inline">{dict.nav.cartLabel}</span>
              {count > 0 && (
                <span className="grid size-[1.15rem] place-items-center rounded-full bg-primary text-[0.65rem] font-semibold tabular-nums text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2 — category mega-menu and section links */}
      <div className="border-b bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6">
          <CategoryMenu
            bookCategories={translate(bookCats)}
            giftCategories={translate(giftCats)}
            labels={{
              categories: dict.nav.categories,
              books: dict.nav.books,
              gifts: dict.nav.gifts,
              allBooks: dict.nav.allBooks,
              allGifts: dict.nav.allGifts,
            }}
          />
          <NavLink href="/books" label={dict.nav.books} />
          <NavLink href="/gifts" label={dict.nav.gifts} />
          <NavLink href="/contact" label={dict.nav.contact} />
          <NavLink href="/blog" label={dict.nav.blog} />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-3 text-sm font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
    >
      {label}
    </Link>
  );
}
