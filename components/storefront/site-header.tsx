import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [count, user, dict, locale] = await Promise.all([
    getCartCount(),
    getCurrentUser(),
    getDictionary(),
    getLocale(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          GIN<span className="text-primary"> Store</span>
        </Link>

        {/* Kept visible on phones: the only way to reach the catalog from the
            header, and there is no hamburger menu. */}
        <nav className="flex flex-1 items-center gap-0.5 sm:gap-1">
          <NavLink href="/books">{dict.nav.books}</NavLink>
          <NavLink href="/gifts">{dict.nav.gifts}</NavLink>
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleToggle locale={locale} />
          <ThemeToggle />

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              {dict.nav.admin}
            </Link>
          )}

          {user ? (
            <SignOutButton label={dict.nav.signOut} />
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
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "relative gap-2",
            )}
          >
            <ShoppingBag className="size-4" strokeWidth={1.75} />
            {count > 0 && (
              <span className="grid size-[1.15rem] place-items-center rounded-full bg-primary text-[0.65rem] font-semibold tabular-nums text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-3"
    >
      {children}
    </Link>
  );
}
