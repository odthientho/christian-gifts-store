"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

/**
 * Below md, the sidebar has nowhere to live permanently — a fixed 240px rail
 * on a 375px phone eats well over half the screen and clips everything else.
 * This swaps it for a hamburger-triggered off-canvas drawer; md and up render
 * the sidebar inline as before (see the (dash) layout).
 */
export function MobileSidebarToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid size-9 place-items-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="font-bold tracking-tight"
              >
                GIN<span className="text-primary"> Store</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            {/* Any nav click inside also closes the drawer. */}
            <div onClick={() => setOpen(false)} className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
