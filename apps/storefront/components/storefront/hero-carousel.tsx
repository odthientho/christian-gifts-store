"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { toAbsoluteImageUrl } from "@/lib/image-url";
import type { HeroSlideDTO } from "@gin/contracts";

// Fallback scripture slides, used only when the admin hasn't configured any
// hero slides yet. Swap `gradient` for a background-image utility — the
// overlay and layout stay the same.
const FALLBACK_SLIDES = [
  {
    ref: { vi: "1 Phi-e-rơ 5:7", en: "1 Peter 5:7" },
    text: {
      vi: "Hãy trao mọi điều lo lắng mình cho Ngài, vì Ngài hay săn sóc anh em.",
      en: "Cast all your anxiety on Him, because He cares for you.",
    },
    gradient:
      "linear-gradient(135deg, oklch(0.35 0.06 250), oklch(0.45 0.08 220) 55%, oklch(0.5 0.1 200))",
  },
  {
    ref: { vi: "Giê-rê-mi 29:11", en: "Jeremiah 29:11" },
    text: {
      vi: "Vì Ta biết ý tưởng Ta nghĩ đối cùng các ngươi, là ý tưởng bình an, để ban cho các ngươi sự trông cậy.",
      en: "For I know the plans I have for you — plans to give you hope and a future.",
    },
    gradient:
      "linear-gradient(135deg, oklch(0.4 0.09 30), oklch(0.5 0.12 40) 55%, oklch(0.6 0.11 60))",
  },
  {
    ref: { vi: "Châm-ngôn 3:5", en: "Proverbs 3:5" },
    text: {
      vi: "Hãy hết lòng tin cậy Đức Giê-hô-va, chớ nương cậy nơi sự thông sáng của con.",
      en: "Trust in the Lord with all your heart, and lean not on your own understanding.",
    },
    gradient:
      "linear-gradient(135deg, oklch(0.34 0.05 160), oklch(0.42 0.07 180) 55%, oklch(0.5 0.08 200))",
  },
];

type Slide = {
  ref: string;
  text: string;
  gradient?: string;
  photo?: string | null;
};

export function HeroCarousel({
  locale,
  slides: apiSlides = [],
  images = [],
}: {
  locale: Locale;
  // Admin-managed slides from the API. When present, these replace the
  // hardcoded fallback entirely.
  slides?: HeroSlideDTO[];
  // Optional photos from /public/img/hero, resolved server-side. Used to
  // decorate the fallback slides only — API slides carry their own imageUrl.
  images?: string[];
}) {
  const slides: Slide[] = useMemo(() => {
    if (apiSlides.length > 0) {
      return apiSlides.map((s) => ({
        ref: locale === "vi" ? s.verseRefVi : s.verseRefEn,
        text: locale === "vi" ? s.textVi : s.textEn,
        photo: s.imageUrl ? toAbsoluteImageUrl(s.imageUrl) : null,
      }));
    }
    return FALLBACK_SLIDES.map((s, i) => ({
      ref: s.ref[locale],
      text: s.text[locale],
      gradient: s.gradient,
      photo: images.length ? images[i % images.length] : null,
    }));
  }, [apiSlides, images, locale]);

  const [index, setIndex] = useState(0);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  // Auto-advance, paused while the tab is hidden.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl sm:aspect-[16/9]">
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-cover bg-center px-6 text-center transition-opacity duration-700 sm:px-14",
            i === index ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={{
            backgroundImage: slide.photo
              ? `url(${slide.photo})`
              : (slide.gradient ?? FALLBACK_SLIDES[0].gradient),
          }}
        >
          <div
            aria-hidden
            className={cn(
              "absolute inset-0",
              slide.photo
                ? "bg-gradient-to-t from-black/70 via-black/45 to-black/40"
                : "bg-[radial-gradient(120%_120%_at_50%_0%,transparent,rgba(0,0,0,0.35))]",
            )}
          />
          <blockquote className="relative max-w-2xl font-heading text-lg font-medium leading-snug text-balance text-white drop-shadow sm:text-2xl md:text-[1.75rem]">
            “{slide.text}”
          </blockquote>
          <cite className="relative mt-4 text-xs font-semibold uppercase not-italic tracking-[0.2em] text-white/85">
            {slide.ref}
          </cite>
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === index}
            className={cn(
              "h-2 rounded-full bg-white/60 transition-all",
              i === index ? "w-6 bg-white" : "w-2 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </div>
  );
}
