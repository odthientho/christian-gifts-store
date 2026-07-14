import { formatCents } from "@gin/contracts";

const WIDTH = 700;
const HEIGHT = 240;
const PADDING_BOTTOM = 28;
// Room for the max-value axis label — a bar chart with no scale reference is
// only readable via hover, which fails for a primary at-a-glance chart.
const PADDING_LEFT = 54;

/** A bar per point, already-formatted labels — the caller decides day/month/year display. */
export function SalesChart({
  points,
}: {
  points: { label: string; totalCents: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.totalCents));
  const plotWidth = WIDTH - PADDING_LEFT;
  const barWidth = plotWidth / Math.max(1, points.length);
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
      {points.length > 0 && (
        <>
          <line
            x1={PADDING_LEFT}
            y1={4}
            x2={WIDTH}
            y2={4}
            className="stroke-neutral-200"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
          <text
            x={PADDING_LEFT - 6}
            y={8}
            textAnchor="end"
            className="fill-neutral-400 text-[9px]"
          >
            {formatCents(max)}
          </text>
          <line
            x1={PADDING_LEFT}
            y1={chartHeight}
            x2={WIDTH}
            y2={chartHeight}
            className="stroke-neutral-200"
            strokeWidth={1}
          />
          <text
            x={PADDING_LEFT - 6}
            y={chartHeight + 3}
            textAnchor="end"
            className="fill-neutral-400 text-[9px]"
          >
            $0
          </text>
        </>
      )}

      {points.map((p, i) => {
        const barHeight = Math.max(2, (p.totalCents / max) * (chartHeight - 8));
        const x = PADDING_LEFT + i * barWidth + barWidth * 0.2;
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
