"use client";

import { Toaster as Sonner } from "sonner";

// The admin has no dark mode / theme system (unlike the storefront), so this
// stays a plain wrapper — just richColors for semantic success/error tinting.
export function Toaster() {
  return <Sonner richColors position="top-center" />;
}
