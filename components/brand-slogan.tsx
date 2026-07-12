import { BRAND_SLOGAN, BRAND_SLOGAN_PARTS } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The brand motto with the leading G / I / N of each phrase emphasised, so the
 * "GIN" acronym reads out of the line. Falls back to a plain string for screen
 * readers via aria-label.
 */
export function BrandSlogan({ className }: { className?: string }) {
  return (
    <p className={cn("text-pretty", className)} aria-label={BRAND_SLOGAN}>
      {BRAND_SLOGAN_PARTS.map((part, i) => (
        <span key={part.lead} aria-hidden>
          <span className="font-semibold text-primary">{part.lead}</span>
          {part.rest}
          {i < BRAND_SLOGAN_PARTS.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
