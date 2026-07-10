import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [count, user] = await Promise.all([getCartCount(), getCurrentUser()]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          Cornerstone
          <span className="text-brass">.</span>
        </Link>

        {/* Kept visible on phones: these two links are the only way to reach
            the catalog from the header, and there is no hamburger menu. */}
        <nav className="flex flex-1 items-center gap-0.5 sm:gap-1">
          <NavLink href="/books">Books</NavLink>
          <NavLink href="/gifts">Gifts</NavLink>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Admin
            </Link>
          )}

          {user ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={
              count === 0 ? "Cart, empty" : `Cart, ${count} items`
            }
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
      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
