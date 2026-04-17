"use client";

import { useEffect, useState } from "react";
import { Link2, MousePointerClick, TrendingUp, Zap } from "lucide-react";

interface Stats {
  totalLinks: number;
  totalClicks: number;
  linksToday: number;
  clicksToday: number;
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

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
    {
      label: "Total Links",
      value: stats?.totalLinks ?? "—",
      icon: Link2,
      gradient: "linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(0, 240, 255, 0.03))",
      iconColor: "#00F0FF",
      borderGlow: "rgba(0, 240, 255, 0.15)",
    },
    {
      label: "Total Clicks",
      value: stats?.totalClicks ?? "—",
      icon: MousePointerClick,
      gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.03))",
      iconColor: "#A855F7",
      borderGlow: "rgba(168, 85, 247, 0.15)",
    },
    {
      label: "Links Today",
      value: stats?.linksToday ?? "—",
      icon: Zap,
      gradient: "linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(52, 211, 153, 0.03))",
      iconColor: "#34D399",
      borderGlow: "rgba(52, 211, 153, 0.15)",
    },
    {
      label: "Clicks Today",
      value: stats?.clicksToday ?? "—",
      icon: TrendingUp,
      gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(251, 191, 36, 0.03))",
      iconColor: "#FBBF24",
      borderGlow: "rgba(251, 191, 36, 0.15)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-fade-in">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="glass glass-hover rounded-xl p-5 flex items-center gap-4"
          style={{
            animationDelay: `${i * 80}ms`,
            animationFillMode: "backwards",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: item.gradient,
              border: `1px solid ${item.borderGlow}`,
            }}
          >
            <item.icon size={20} style={{ color: item.iconColor }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
