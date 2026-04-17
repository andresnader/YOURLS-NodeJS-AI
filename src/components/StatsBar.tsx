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
    {
      label: t("stats.links"),
      value: stats?.totalLinks ?? "—",
      icon: Link2,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      borderGlow: "border-primary/20",
    },
    {
      label: t("stats.clicks"),
      value: stats?.totalClicks ?? "—",
      icon: MousePointerClick,
      bg: "bg-accent/10",
      iconColor: "text-accent",
      borderGlow: "border-accent/20",
    },
    {
      label: t("stats.links_today"),
      value: stats?.linksToday ?? "—",
      icon: Zap,
      bg: "bg-success/10",
      iconColor: "text-success",
      borderGlow: "border-success/20",
    },
    {
      label: t("stats.clicks_today"),
      value: stats?.clicksToday ?? "—",
      icon: TrendingUp,
      bg: "bg-amber-400/10",
      iconColor: "text-amber-400",
      borderGlow: "border-amber-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-fade-in transition-colors duration-300">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`glass glass-hover rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 ${item.borderGlow} border`}
          style={{
            animationDelay: `${i * 80}ms`,
            animationFillMode: "backwards",
          }}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}
          >
            <item.icon size={20} className={item.iconColor} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-primary truncate">
              {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted truncate">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

