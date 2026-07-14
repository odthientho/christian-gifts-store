import Link from "next/link";

import { requireAdmin } from "@/lib/require-admin";
import { apiLowStockCount } from "@/lib/api";
import { logoutAction } from "@/server/actions";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, lowStockCount] = await Promise.all([
    requireAdmin(),
    apiLowStockCount(),
  ]);
  const initial = admin.email.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-white">
        <Link href="/dashboard" className="flex items-center px-4 py-4 font-bold tracking-tight">
          GIN<span className="text-primary"> Store</span>
        </Link>
        <SidebarNav lowStockCount={lowStockCount} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b bg-white px-6 py-3">
          <span className="text-sm text-neutral-500">{admin.email}</span>
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </span>
          <form action={logoutAction}>
            <button className="text-sm text-neutral-600 hover:text-primary">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
