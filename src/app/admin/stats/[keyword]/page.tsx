"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, BarChart3, Globe, Clock,
  Monitor, MousePointerClick, Link2
} from "lucide-react";
import Link from "next/link";

interface StatsData {
  url: {
    keyword: string;
    url: string;
    title: string | null;
    clicks: number;
    createdAt: string;
  };
  totalClicks: number;
  referrers: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  recentLogs: {
    id: number;
    clickedAt: string;
    referrer: string;
    userAgent: string | null;
    ipAddress: string | null;
    countryCode: string | null;
  }[];
}

const browserColors: Record<string, string> = {
  Chrome: "#4285F4",
  Firefox: "#FF7139",
  Safari: "#0096FF",
  Edge: "#0078D7",
  Opera: "#FF1B2D",
  Other: "#64748B",
};

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const keyword = params.keyword as string;
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats/${keyword}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(() => {
        router.push("/admin");
      })
      .finally(() => setLoading(false));
  }, [keyword, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full"
          style={{ borderColor: "#00F0FF", borderTopColor: "transparent" }}
        />
      </main>
    );
  }

  if (!stats) return null;

  const maxDaily = Math.max(...stats.dailyClicks.map((d) => d.count), 1);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="fixed top-[-10%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)",
          animation: "floatOrb 20s ease-in-out infinite",
        }}
      />
      <div
        className="fixed bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, transparent 70%)",
          animation: "floatOrb 25s ease-in-out infinite reverse",
        }}
      />

      {/* Nav */}
      <nav
        className="sticky top-0 z-30 px-6 py-3"
        style={{
          background: "rgba(4, 6, 9, 0.6)",
          backdropFilter: "blur(24px) saturate(1.5)",
          borderBottom: "1px solid var(--border-glass)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#00F0FF"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.1))",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                boxShadow: "0 0 25px -5px rgba(0, 240, 255, 0.2)",
              }}
            >
              <Link2 size={20} style={{ color: "#00F0FF" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "#00F0FF" }}>/{stats.url.keyword}</span>
              </h1>
              {stats.url.title && (
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {stats.url.title}
                </p>
              )}
              <a
                href={stats.url.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs mt-2 hover:underline transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <ExternalLink size={11} />
                {stats.url.url}
              </a>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <div className="glass glass-hover rounded-xl p-5 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(0, 240, 255, 0.03))",
                border: "1px solid rgba(0, 240, 255, 0.15)",
              }}
            >
              <MousePointerClick size={18} style={{ color: "#00F0FF" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stats.totalClicks.toLocaleString()}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Total Clicks
              </p>
            </div>
          </div>
          <div className="glass glass-hover rounded-xl p-5 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.03))",
                border: "1px solid rgba(168, 85, 247, 0.15)",
              }}
            >
              <Globe size={18} style={{ color: "#A855F7" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stats.referrers.length}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Referrer Sources
              </p>
            </div>
          </div>
          <div className="glass glass-hover rounded-xl p-5 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(52, 211, 153, 0.03))",
                border: "1px solid rgba(52, 211, 153, 0.15)",
              }}
            >
              <Clock size={18} style={{ color: "#34D399" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {new Date(stats.url.createdAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Created Date
              </p>
            </div>
          </div>
        </div>

        {/* Click Chart */}
        {stats.dailyClicks.length > 0 && (
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: "var(--text-muted)" }}>
              <BarChart3 size={14} className="inline mr-1.5" style={{ color: "#00F0FF" }} />
              Click History (Last 30 Days)
            </h3>
            <div className="flex items-end gap-1 h-40">
              {stats.dailyClicks.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  style={{ height: "100%" }}
                >
                  <div
                    className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold px-2 py-1 rounded-md"
                    style={{
                      background: "rgba(0, 240, 255, 0.15)",
                      color: "#00F0FF",
                      border: "1px solid rgba(0, 240, 255, 0.2)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {day.count}
                  </div>
                  <div
                    className="w-full transition-all group-hover:opacity-80"
                    style={{
                      height: `${(day.count / maxDaily) * 100}%`,
                      minHeight: "4px",
                      background: "linear-gradient(180deg, #00F0FF, rgba(0, 240, 255, 0.3))",
                      borderRadius: "4px 4px 0 0",
                      boxShadow: day.count > 0 ? "0 0 8px -2px rgba(0, 240, 255, 0.3)" : "none",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {stats.dailyClicks[0]?.date}
              </span>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {stats.dailyClicks[stats.dailyClicks.length - 1]?.date}
              </span>
            </div>
          </div>
        )}

        {/* Referrers & Browsers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Referrers */}
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--text-muted)" }}>
              <Globe size={14} className="inline mr-1.5" style={{ color: "#A855F7" }} />
              Top Referrers
            </h3>
            {stats.referrers.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No referrer data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.referrers.map((ref) => (
                  <div key={ref.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>
                          {ref.name}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "#00F0FF" }}>
                          {ref.count}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255, 255, 255, 0.04)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(ref.count / (stats.referrers[0]?.count || 1)) * 100}%`,
                            background: "linear-gradient(90deg, #00F0FF, var(--color-primary-dim))",
                            boxShadow: "0 0 8px -2px rgba(0, 240, 255, 0.4)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browsers */}
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--text-muted)" }}>
              <Monitor size={14} className="inline mr-1.5" style={{ color: "#FBBF24" }} />
              Browsers
            </h3>
            {stats.browsers.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No browser data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.browsers.map((b) => (
                  <div key={b.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: browserColors[b.name] || "#64748B",
                        boxShadow: `0 0 8px -1px ${browserColors[b.name] || "#64748B"}50`,
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {b.name}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {b.count} ({Math.round((b.count / stats.totalClicks) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255, 255, 255, 0.04)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(b.count / stats.totalClicks) * 100}%`,
                            backgroundColor: browserColors[b.name] || "#64748B",
                            boxShadow: `0 0 8px -2px ${browserColors[b.name] || "#64748B"}60`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Clicks */}
        {stats.recentLogs.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-glass)" }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
                Recent Clicks
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Time
                    </th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Referrer
                    </th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] hidden md:table-cell" style={{ color: "var(--text-muted)" }}>
                      IP
                    </th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>
                      Country
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid var(--border-glass)" }}
                    >
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {new Date(log.clickedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-xs truncate max-w-[200px]" style={{ color: "var(--text-secondary)" }}>
                        {log.referrer}
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden md:table-cell font-mono" style={{ color: "var(--text-muted)" }}>
                        {log.ipAddress || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>
                        {log.countryCode || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
