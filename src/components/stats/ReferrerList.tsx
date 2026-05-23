"use client";

import { ExternalLink, Globe } from "lucide-react";

export default function ReferrerList({
  referrers,
}: {
  referrers: Record<string, number>;
}) {
  const sorted = Object.entries(referrers).sort(([, a], [, b]) => b - a).slice(0, 10);
  if (sorted.length === 0) {
    return (
      <p
        className="text-[13px] py-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        No referrer data yet.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {sorted.map(([ref, n]) => {
        const isDirect = ref === "Direct";
        const href = !isDirect && /^https?:\/\//.test(ref) ? ref : null;
        return (
          <li
            key={ref}
            className="flex items-center gap-3 py-2.5"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            {isDirect ? (
              <Globe
                size={13}
                strokeWidth={1.75}
                style={{ color: "var(--text-muted)" }}
              />
            ) : (
              <ExternalLink
                size={13}
                strokeWidth={1.75}
                style={{ color: "var(--color-primary)" }}
              />
            )}
            <span
              className="flex-1 truncate text-[13px]"
              style={{
                color: isDirect ? "var(--text-muted)" : "var(--text-primary)",
                fontStyle: isDirect ? "italic" : "normal",
              }}
            >
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {ref}
                </a>
              ) : (
                ref
              )}
            </span>
            <span
              className="font-mono text-[13px] tabular-nums shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              {n.toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
