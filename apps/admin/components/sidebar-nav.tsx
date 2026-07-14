"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Image as ImageIcon,
} from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/content", label: "Site content", icon: ImageIcon },
];

export function SidebarNav({ lowStockCount = 0 }: { lowStockCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
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
            {href === "/products" && lowStockCount > 0 && (
              <span
                title={`${lowStockCount} product${lowStockCount === 1 ? "" : "s"} low on stock`}
                className={`ml-auto grid size-5 place-items-center rounded-full text-[0.65rem] font-semibold tabular-nums ${
                  active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                {lowStockCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
