import Link from "next/link";
import { SiteHeader } from "@/components/storefront/site-header";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cornerstone Christian Gifts & Books</p>
          <nav className="flex gap-4">
            <Link href="/books" className="hover:text-foreground">
              Books
            </Link>
            <Link href="/gifts" className="hover:text-foreground">
              Gifts
            </Link>
            <Link href="/cart" className="hover:text-foreground">
              Cart
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
