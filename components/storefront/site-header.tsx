import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function SiteHeader() {
  const [count, user] = await Promise.all([getCartCount(), getCurrentUser()]);

  return (
    <header className="border-b bg-background/95 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Cornerstone
        </Link>

        <nav className="hidden gap-6 text-sm sm:flex">
          <Link href="/books" className="hover:text-primary transition-colors">
            Books
          </Link>
          <Link href="/gifts" className="hover:text-primary transition-colors">
            Gifts
          </Link>
        </nav>

        <div className="flex items-center gap-2">
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
            aria-label={`Cart, ${count} items`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ShoppingBag className="size-4" />
            <span className="ml-1 tabular-nums">{count}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
