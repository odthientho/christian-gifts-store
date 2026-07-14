import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

const CAPTION_TONE_CLASSES = {
  neutral: "text-neutral-400",
  warning: "text-amber-600",
  danger: "text-red-600",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  changePct,
  changeCaption = "vs. prior 7 days",
  caption,
  captionTone = "neutral",
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "neutral" | "warning";
  // Week-over-week % change. `undefined` means "not applicable to this
  // metric"; `null` means "applicable, but no prior-period data to compare
  // against" — the two render differently so a missing baseline never gets
  // silently misread as 0% (no) change.
  changePct?: number | null;
  changeCaption?: string;
  // A plain sub-line instead of a trend — for metrics where a % change
  // wouldn't mean anything (e.g. a count broken into two parts), or to fold
  // in an alert (e.g. "2 awaiting payment") right where the related number is.
  caption?: string;
  captionTone?: "neutral" | "warning" | "danger";
  // Wraps the whole card in a link — e.g. straight to the filtered order list
  // the caption is describing.
  href?: string;
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-neutral-100 text-neutral-600",
    warning: "bg-amber-100 text-amber-700",
  }[tone];

  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <span className={`grid size-9 place-items-center rounded-full ${toneClasses}`}>
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>

      {changePct !== undefined && (
        <p className="mt-1.5 flex items-center gap-1 text-xs">
          {changePct === null ? (
            <span className="text-neutral-400">Not enough data yet</span>
          ) : (
            <>
              <span
                className={`flex items-center gap-0.5 font-medium ${
                  changePct > 0
                    ? "text-emerald-600"
                    : changePct < 0
                      ? "text-red-600"
                      : "text-neutral-500"
                }`}
              >
                {changePct > 0 ? (
                  <ArrowUp className="size-3" strokeWidth={2.5} />
                ) : changePct < 0 ? (
                  <ArrowDown className="size-3" strokeWidth={2.5} />
                ) : (
                  <Minus className="size-3" strokeWidth={2.5} />
                )}
                {Math.abs(changePct)}%
              </span>
              <span className="text-neutral-400">{changeCaption}</span>
            </>
          )}
        </p>
      )}

      {caption && (
        <p className={`mt-1.5 text-xs font-medium ${CAPTION_TONE_CLASSES[captionTone]}`}>
          {caption}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border bg-white p-5 transition-colors hover:bg-neutral-50"
      >
        {body}
      </Link>
    );
  }

  return <div className="rounded-xl border bg-white p-5">{body}</div>;
}
