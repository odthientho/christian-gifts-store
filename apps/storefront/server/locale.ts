"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

/**
 * Persist the visitor's language choice. A first-party preference cookie, not
 * used for tracking, so it needs no consent banner. One year, lax, httpOnly is
 * off on purpose — no client reads it, but keeping it script-visible costs
 * nothing and avoids surprises if that changes.
 */
export async function setLocaleAction(next: string): Promise<void> {
  if (!isLocale(next)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
