"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/server/locale";
import { cn } from "@/lib/utils";

/**
 * Two-segment vi / EN switch. Sets the locale cookie via a Server Action, then
 * refreshes so every Server Component re-renders in the new language.
 */
export function LocaleToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function pick(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-full border bg-card p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      {(["vi", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => pick(code)}
          aria-pressed={locale === code}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors disabled:opacity-60",
            locale === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
