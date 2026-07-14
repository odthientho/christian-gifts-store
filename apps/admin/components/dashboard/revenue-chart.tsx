import type { RevenueByDayDTO } from "@gin/contracts";
import { formatCents } from "@gin/contracts";

const WIDTH = 700;
const HEIGHT = 220;
const PADDING_BOTTOM = 24;

export function RevenueChart({ days }: { days: RevenueByDayDTO[] }) {
  const max = Math.max(1, ...days.map((d) => d.totalCents));
  const barWidth = WIDTH / days.length;
  const chartHeight = HEIGHT - PADDING_BOTTOM;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Revenue by day">
      {days.map((d, i) => {
        const barHeight = Math.max(2, (d.totalCents / max) * (chartHeight - 8));
        const x = i * barWidth + barWidth * 0.2;
        const y = chartHeight - barHeight;
        const label = new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        });
        return (
          <g key={d.date}>
            <title>
              {label}: {formatCents(d.totalCents)}
            </title>
            <rect
              x={x}
              y={y}
              width={barWidth * 0.6}
              height={barHeight}
              rx={4}
              className={d.totalCents > 0 ? "fill-primary" : "fill-neutral-100"}
            />
            {i % 2 === 0 && (
              <text
                x={x + (barWidth * 0.6) / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-neutral-400 text-[9px]"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
