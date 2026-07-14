import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "neutral" | "warning";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-neutral-100 text-neutral-600",
    warning: "bg-amber-100 text-amber-700",
  }[tone];

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <span className={`grid size-9 place-items-center rounded-full ${toneClasses}`}>
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
