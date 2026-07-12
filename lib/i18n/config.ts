export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// The reference store and its audience are Vietnamese, so that is the default.
export const DEFAULT_LOCALE: Locale = "vi";

export const LOCALE_COOKIE = "cgs-locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "vi" || value === "en";
}
