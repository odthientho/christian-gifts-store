import { formatCents } from "@gin/contracts";

const WIDTH = 700;
const HEIGHT = 240;
const PADDING_BOTTOM = 28;

/** A bar per point, already-formatted labels — the caller decides day/month/year display. */
export function SalesChart({
  points,
}: {
  points: { label: string; totalCents: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.totalCents));
  const barWidth = WIDTH / Math.max(1, points.length);
  const chartHeight = HEIGHT - PADDING_BOTTOM;
  // Thin out x-axis labels so they don't collide when there are many bars.
  const labelEvery = Math.max(1, Math.ceil(points.length / 12));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Sales over time"
    >
      {points.map((p, i) => {
        const barHeight = Math.max(2, (p.totalCents / max) * (chartHeight - 8));
        const x = i * barWidth + barWidth * 0.2;
        const y = chartHeight - barHeight;
        return (
          <g key={`${p.label}-${i}`}>
            <title>
              {p.label}: {formatCents(p.totalCents)}
            </title>
            <rect
              x={x}
              y={y}
              width={barWidth * 0.6}
              height={barHeight}
              rx={4}
              className={p.totalCents > 0 ? "fill-primary" : "fill-neutral-100"}
            />
            {i % labelEvery === 0 && (
              <text
                x={x + (barWidth * 0.6) / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-neutral-400 text-[9px]"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
      {points.length === 0 && (
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          className="fill-neutral-400 text-sm"
        >
          No sales in this period yet.
        </text>
      )}
    </svg>
  );
}
