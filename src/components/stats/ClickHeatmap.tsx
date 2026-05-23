"use client";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClickHeatmap({ data }: { data: number[][] }) {
  const max = Math.max(1, ...data.flat());
  const empty = data.flat().every((v) => v === 0);

  if (empty) {
    return (
      <p
        className="text-[13px] py-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        No timing data captured yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: "auto repeat(24, minmax(14px, 1fr))" }}>
        {/* Hour header row */}
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={`h-${h}`}
            className="text-[10px] text-center tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {h % 3 === 0 ? h : ""}
          </div>
        ))}

        {/* Day rows */}
        {data.map((row, day) => (
          <DayRow key={day} dayName={DAYS[day]} row={row} max={max} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span>Less</span>
        {[0.15, 0.35, 0.55, 0.75, 1].map((alpha, i) => (
          <span
            key={i}
            className="w-4 h-3 inline-block"
            style={{
              background: `color-mix(in oklab, var(--color-primary) ${alpha * 100}%, transparent)`,
              borderRadius: 2,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function DayRow({
  dayName,
  row,
  max,
}: {
  dayName: string;
  row: number[];
  max: number;
}) {
  return (
    <>
      <div
        className="text-[11px] pr-3 self-center tabular-nums"
        style={{ color: "var(--text-muted)" }}
      >
        {dayName}
      </div>
      {row.map((v, h) => {
        const alpha = v === 0 ? 0 : 0.15 + 0.85 * (v / max);
        return (
          <div
            key={h}
            title={`${dayName} ${h}:00 — ${v} click${v === 1 ? "" : "s"}`}
            className="aspect-square w-full"
            style={{
              background:
                v === 0
                  ? "var(--bg-elevated)"
                  : `color-mix(in oklab, var(--color-primary) ${alpha * 100}%, transparent)`,
              borderRadius: 2,
            }}
          />
        );
      })}
    </>
  );
}
