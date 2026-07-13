import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

export type { Locale } from "@/lib/i18n/config";
export type { Dictionary } from "@/lib/i18n/dictionaries";

/** The visitor's locale, from their cookie, defaulting to Vietnamese. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The dictionary for the visitor's locale. Call this in Server Components. */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}

export function dictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/**
 * Translate a category by its slug, falling back to the database name for any
 * category added after these dictionaries were written.
 */
export function translateCategory(
  dict: Dictionary,
  slug: string,
  fallback: string,
): string {
  return (dict.categories as Record<string, string>)[slug] ?? fallback;
}

/** Fill `{name}` placeholders. `interpolate("Only {n} left", { n: 3 })`. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}
