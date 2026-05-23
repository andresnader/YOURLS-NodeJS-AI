import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, Calendar, MousePointer2 } from "lucide-react";
import StatsCharts from "@/components/StatsCharts";
import { getKeywordStats } from "@/lib/stats";

export default async function KeywordStatsPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const { keyword } = await params;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-12 animate-fade-in">
      <header className="space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[13px] transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          Back to dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-eyebrow">Link analytics</p>
            <h1
              className="text-h1"
              style={{ color: "var(--text-primary)" }}
            >
              <span
                className="font-mono text-[28px] md:text-[32px]"
                style={{ color: "var(--color-primary)" }}
              >
                /{keyword}
              </span>
            </h1>
          </div>
          <a
            href={`/${keyword}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost inline-flex items-center gap-2 text-[13px]"
          >
            <ExternalLink size={14} strokeWidth={1.75} />
            Visit link
          </a>
        </div>
      </header>

      <hr className="rule" />

      <Suspense
        fallback={
          <div
            className="p-12 text-center border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-muted)",
            }}
          >
            Loading analytics…
          </div>
        }
      >
        <StatsContent keyword={keyword} />
      </Suspense>
    </div>
  );
}

async function StatsContent({ keyword }: { keyword: string }) {
  try {
    const data = await getKeywordStats(keyword);
    if (!data) notFound();

    return (
      <div className="space-y-12">
        {/* Summary KPIs */}
        <section>
          <h2 className="text-eyebrow mb-5">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total clicks",
                value: data.totalClicks.toLocaleString(),
                icon: MousePointer2,
              },
              {
                label: "Countries",
                value: Object.keys(data.countries).length.toString(),
                icon: Globe,
              },
              {
                label: "Peak velocity",
                value: Math.max(...Object.values(data.timeSeries)).toString(),
                icon: Calendar,
              },
              {
                label: "Destination",
                value: data.longUrl,
                icon: ExternalLink,
                mono: true,
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="p-5 md:p-6 flex flex-col gap-3"
                style={{
                  background: "var(--bg-surface)",
                  borderLeft: i === 0 ? "1px solid var(--border)" : "none",
                  borderRight: "1px solid var(--border)",
                  borderTop: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  marginLeft: i === 0 ? 0 : "-1px",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-eyebrow">{stat.label}</p>
                  <stat.icon
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
                <p
                  className={
                    stat.mono
                      ? "font-mono text-[13px] truncate"
                      : "font-serif text-[28px] leading-none tracking-tight"
                  }
                  style={{ color: "var(--text-primary)" }}
                  title={stat.mono ? stat.value : undefined}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Charts */}
        <section>
          <h2 className="text-eyebrow mb-5">Trends</h2>
          <StatsCharts data={data} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("[stats page]", error);
    return (
      <div
        className="p-12 text-center border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          borderRadius: "var(--radius-lg)",
          color: "var(--color-danger)",
        }}
      >
        Could not load stats for this keyword. Try again in a moment.
      </div>
    );
  }
}
