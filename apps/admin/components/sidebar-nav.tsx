"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Image as ImageIcon,
  BarChart3,
} from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/content", label: "Site content", icon: ImageIcon },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function SidebarNav({
  lowStockCount = 0,
  pendingPaymentCount = 0,
}: {
  lowStockCount?: number;
  pendingPaymentCount?: number;
}) {
  const pathname = usePathname();

  const badges: Record<string, { count: number; title: string }> = {
    "/products": {
      count: lowStockCount,
      title: `${lowStockCount} product${lowStockCount === 1 ? "" : "s"} low on stock`,
    },
    "/orders": {
      count: pendingPaymentCount,
      title: `${pendingPaymentCount} order${pendingPaymentCount === 1 ? "" : "s"} awaiting payment`,
    },
  };

  return (
    <nav className="flex flex-col gap-1 p-3">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const badge = badges[href];
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Icon className="size-5" strokeWidth={1.75} />
            {label}
            {badge && badge.count > 0 && (
              <span
                title={badge.title}
                className={`ml-auto grid size-5 place-items-center rounded-full text-[0.65rem] font-semibold tabular-nums ${
                  active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                {badge.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
