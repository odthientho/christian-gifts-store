import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** The "THIS WEEK'S PICKS ————  View all →" section header from the reference. */
export function SectionHeading({
  title,
  href,
  viewAllLabel,
}: {
  title: string;
  href?: string;
  viewAllLabel: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-primary/15 pb-3">
      <h2 className="relative font-heading text-xl font-bold uppercase tracking-wide sm:text-2xl">
        {title}
        <span className="absolute -bottom-[calc(0.75rem+2px)] left-0 h-0.5 w-24 bg-primary" />
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {viewAllLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
