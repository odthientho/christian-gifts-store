import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate the whole segment. Each page and each Server Action re-checks anyway:
  // a layout does not run before a Server Action, so this alone is not enough.
  const admin = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:h-auto lg:flex-col lg:items-stretch lg:px-4 lg:pt-6">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-heading text-lg font-semibold tracking-tight">
              Cornerstone<span className="text-brass">.</span>
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-primary">
              Admin
            </span>
          </Link>
        </div>

        <div className="px-2 pb-3 lg:px-3 lg:pt-6">
          <AdminNav />
        </div>

        <div className="hidden border-t px-4 py-4 lg:mt-auto lg:block">
          <p className="truncate text-xs text-muted-foreground" title={admin.email}>
            {admin.email}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <div className="-ml-2">
              <SignOutButton />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-1 border-b px-4 py-2 lg:hidden">
          <ThemeToggle />
          <SignOutButton />
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
