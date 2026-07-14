import type { CategoryRevenueDTO } from "@gin/contracts";
import { formatCents } from "@gin/contracts";

const COLORS = [
  "oklch(0.616 0.189 28.1)",
  "oklch(0.7 0.15 45)",
  "oklch(0.5 0.1 210)",
  "oklch(0.6 0.11 60)",
  "oklch(0.42 0.07 180)",
];

export function CategoryDonut({ categories }: { categories: CategoryRevenueDTO[] }) {
  const total = categories.reduce((s, c) => s + c.totalCents, 0);

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-neutral-500">No sales yet.</p>;
  }

  const { stops } = categories.reduce<{ stops: string[]; cursor: number }>(
    (acc, c, i) => {
      const pct = (c.totalCents / total) * 100;
      const end = acc.cursor + pct;
      acc.stops.push(`${COLORS[i % COLORS.length]} ${acc.cursor}% ${end}%`);
      return { stops: acc.stops, cursor: end };
    },
    { stops: [], cursor: 0 },
  );

  return (
    <div className="flex items-center gap-6">
      <div
        className="grid size-32 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="grid size-20 place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wide text-neutral-400">Total</p>
            <p className="text-sm font-semibold">{formatCents(total)}</p>
          </div>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {categories.map((c, i) => (
          <li key={c.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {c.name}
            </span>
            <span className="tabular-nums text-neutral-500">{formatCents(c.totalCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
