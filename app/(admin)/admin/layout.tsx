import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate the whole segment. Each page and each Server Action re-checks anyway:
  // a layout does not run before a Server Action, so this alone is not enough.
  const admin = await requireAdmin();

  return (
    <>
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold tracking-tight">
              Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className="text-muted-foreground hover:text-foreground"
              >
                Orders
              </Link>
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground"
              >
                View store
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {admin.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}
