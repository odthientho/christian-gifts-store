import Link from "next/link";

import { requireAdmin } from "@/lib/require-admin";
import { logoutAction } from "@/server/actions";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link href="/products" className="font-bold tracking-tight">
            GIN<span className="text-primary"> Store</span>
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-primary">
              Admin
            </span>
          </Link>
          <nav className="flex-1 text-sm">
            <Link href="/products" className="text-neutral-600 hover:text-primary">
              Products
            </Link>
          </nav>
          <span className="text-xs text-neutral-500">{admin.email}</span>
          <form action={logoutAction}>
            <button className="text-sm text-neutral-600 hover:text-primary">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
