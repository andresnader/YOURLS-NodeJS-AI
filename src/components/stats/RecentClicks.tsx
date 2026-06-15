"use client";

import type { RecentClick } from "@/lib/stats";
import { Smartphone, Monitor, Tablet } from "lucide-react";

function flag(code: string | null): string {
  if (!code || code.length !== 2) return "—";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

function relative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es");
}

function deviceIcon(device: string | null) {
  if (device === "mobile")
    return <Smartphone size={12} strokeWidth={1.75} />;
  if (device === "tablet") return <Tablet size={12} strokeWidth={1.75} />;
  return <Monitor size={12} strokeWidth={1.75} />;
}

export default function RecentClicks({ rows }: { rows: RecentClick[] }) {
  if (rows.length === 0) {
    return (
      <p
        className="text-[13px] py-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Aún no hay clics registrados en este periodo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-[13px]">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {[
              { h: "Cuándo", w: 130 },
              { h: "Dónde", w: undefined },
              { h: "Dispositivo", w: 140 },
              { h: "Navegador", w: 120 },
              { h: "Referente", w: undefined },
            ].map(({ h, w }) => (
              <th
                key={h}
                className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ color: "var(--text-muted)", width: w }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: "1px solid var(--border-soft)" }}
            >
              <td
                className="px-3 py-2.5 whitespace-nowrap"
                style={{ color: "var(--text-secondary)" }}
                title={new Date(row.at).toLocaleString()}
              >
                {relative(row.at)}
              </td>
              <td
                className="px-3 py-2.5"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="mr-1.5">{flag(row.countryCode)}</span>
                {row.city || (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </td>
              <td
                className="px-3 py-2.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  {deviceIcon(row.device)}
                  {row.os || "—"}
                </span>
              </td>
              <td
                className="px-3 py-2.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {row.browser || "—"}
              </td>
              <td
                className="px-3 py-2.5 truncate"
                style={{
                  color:
                    row.referrer === "Directo"
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  fontStyle: row.referrer === "Directo" ? "italic" : "normal",
                }}
                title={row.referrer || ""}
              >
                {row.referrer}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
