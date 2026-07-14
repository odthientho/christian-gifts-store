import Link from "next/link";

import { requireAdmin } from "@/lib/require-admin";
import { apiLowStockCount, apiPendingPaymentCount } from "@/lib/api";
import { logoutAction } from "@/server/actions";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileSidebarToggle } from "@/components/mobile-sidebar-toggle";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, lowStockCount, pendingPaymentCount] = await Promise.all([
    requireAdmin(),
    apiLowStockCount(),
    apiPendingPaymentCount(),
  ]);
  const initial = admin.email.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Inline on md+; below that, MobileSidebarToggle renders this same nav
          inside an off-canvas drawer instead. */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-white md:flex">
        <Link href="/dashboard" className="flex items-center px-4 py-4 font-bold tracking-tight">
          GIN<span className="text-primary"> Store</span>
        </Link>
        <SidebarNav
          lowStockCount={lowStockCount}
          pendingPaymentCount={pendingPaymentCount}
        />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebarToggle>
              <SidebarNav
                lowStockCount={lowStockCount}
                pendingPaymentCount={pendingPaymentCount}
              />
            </MobileSidebarToggle>
            <Link href="/dashboard" className="font-bold tracking-tight md:hidden">
              GIN<span className="text-primary"> Store</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">{admin.email}</span>
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </span>
            <form action={logoutAction}>
              <button className="text-sm text-neutral-600 hover:text-primary">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
