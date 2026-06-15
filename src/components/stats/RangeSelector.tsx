"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const RANGES = [
  { value: "24h", label: "24 horas" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "all", label: "Histórico" },
] as const;

export default function RangeSelector({ active }: { active: string }) {
  const pathname = usePathname();
  const params = useSearchParams();

  const buildHref = (range: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("range", range);
    return `${pathname}?${next.toString()}`;
  };

  return (
    <div
      className="inline-flex p-0.5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {RANGES.map((r) => {
        const selected = r.value === active;
        return (
          <Link
            key={r.value}
            href={buildHref(r.value)}
            scroll={false}
            className="px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: selected ? "var(--bg-surface)" : "transparent",
              color: selected ? "var(--text-primary)" : "var(--text-muted)",
              borderRadius: "calc(var(--radius-md) - 2px)",
              boxShadow: selected ? "var(--shadow-sm)" : "none",
            }}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
