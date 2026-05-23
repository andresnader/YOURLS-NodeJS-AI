"use client";

import { useEffect, useState } from "react";
import { Link2, MousePointerClick, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "@/lib/LanguageContext";

interface Stats {
  totalLinks: number;
  totalClicks: number;
  linksToday: number;
  clicksToday: number;
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Instant update stats when a new link is created
  useEffect(() => {
    const handleLinkCreated = () => {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalLinks: prev.totalLinks + 1,
          linksToday: prev.linksToday + 1
        };
      });
    };

    window.addEventListener('link-created', handleLinkCreated);
    return () => window.removeEventListener('link-created', handleLinkCreated);
  }, []);

  const items = [
    { label: t("stats.links"),         value: stats?.totalLinks ?? "—",   icon: Link2 },
    { label: t("stats.clicks"),        value: stats?.totalClicks ?? "—",  icon: MousePointerClick },
    { label: t("stats.links_today"),   value: stats?.linksToday ?? "—",   icon: Zap },
    { label: t("stats.clicks_today"),  value: stats?.clicksToday ?? "—",  icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 w-full animate-fade-in">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="p-5 md:p-6 flex flex-col gap-3"
          style={{
            borderLeft: i === 0 ? "1px solid var(--border)" : "none",
            borderRight: "1px solid var(--border)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            marginLeft: i === 0 ? 0 : "-1px",
            background: "var(--bg-surface)",
            animationDelay: `${i * 60}ms`,
            animationFillMode: "backwards",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-eyebrow">{item.label}</p>
            <item.icon size={15} strokeWidth={1.75} style={{ color: "var(--text-muted)" }} />
          </div>
          <p
            className="font-serif text-[32px] leading-none tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

