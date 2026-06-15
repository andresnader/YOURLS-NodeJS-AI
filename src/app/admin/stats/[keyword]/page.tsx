import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Calendar,
  MousePointer2,
  Download,
} from "lucide-react";
import StatsCharts from "@/components/StatsCharts";
import GeoChart from "@/components/stats/GeoChart";
import ReferrerList from "@/components/stats/ReferrerList";
import RecentClicks from "@/components/stats/RecentClicks";
import ClickHeatmap from "@/components/stats/ClickHeatmap";
import RangeSelector from "@/components/stats/RangeSelector";
import { getKeywordStats, type TimeRange } from "@/lib/stats";

const VALID_RANGES: TimeRange[] = ["24h", "7d", "30d", "90d", "all"];

export default async function KeywordStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ keyword: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { keyword } = await params;
  const { range: rangeRaw } = await searchParams;
  const range: TimeRange = (VALID_RANGES as string[]).includes(rangeRaw ?? "")
    ? (rangeRaw as TimeRange)
    : "7d";

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-12 animate-fade-in">
      <header className="space-y-5">
        <Link
          href="/admin/stats"
          className="inline-flex items-center gap-1.5 text-[13px] transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          Volver a estadísticas
        </Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-eyebrow">Analíticas del enlace</p>
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
          <div className="flex items-center gap-2">
            <a
              href={`/api/stats/${keyword}/export?range=${range}`}
              className="btn-ghost inline-flex items-center gap-2 text-[13px]"
              download
            >
              <Download size={14} strokeWidth={1.75} />
              Exportar CSV
            </a>
            <a
              href={`/${keyword}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex items-center gap-2 text-[13px]"
            >
              <ExternalLink size={14} strokeWidth={1.75} />
              Visitar enlace
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <span className="text-eyebrow">Periodo</span>
          <RangeSelector active={range} />
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
            Cargando analíticas…
          </div>
        }
      >
        <StatsContent keyword={keyword} range={range} />
      </Suspense>
    </div>
  );
}

async function StatsContent({
  keyword,
  range,
}: {
  keyword: string;
  range: TimeRange;
}) {
  try {
    const data = await getKeywordStats(keyword, range);
    if (!data) notFound();

    const peakInRange = Math.max(0, ...Object.values(data.timeSeries));

    return (
      <div className="space-y-12">
        {/* Overview KPIs */}
        <section>
          <h2 className="text-eyebrow mb-5">Resumen</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Clics totales",
                value: data.totalClicks.toLocaleString(),
                icon: MousePointer2,
              },
              {
                label: range === "all" ? "Clics históricos" : `Clics en el periodo`,
                value: data.rangeClicks.toLocaleString(),
                icon: Calendar,
              },
              {
                label: "Países",
                value: Object.keys(data.countries).length.toString(),
                icon: Globe,
              },
              {
                label: range === "24h" ? "Hora pico" : "Día pico",
                value: peakInRange.toString(),
                icon: Calendar,
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
                  className="font-serif text-[28px] leading-none tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Destination */}
        <section>
          <h2 className="text-eyebrow mb-3">Destino</h2>
          <a
            href={data.longUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[14px] hover:underline truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {data.longUrl}
            <ExternalLink size={12} strokeWidth={1.75} />
          </a>
        </section>

        {/* Trend + Heatmap */}
        <section>
          <h2 className="text-eyebrow mb-5">Tendencias</h2>
          <StatsCharts data={data} />
        </section>

        {/* Heatmap (only useful with enough data) */}
        <section>
          <h2 className="text-eyebrow mb-5">Mapa de actividad</h2>
          <div
            className="p-6 border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="mb-4">
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Día de la semana vs hora (UTC). Más oscuro = más clics.
              </p>
            </div>
            <ClickHeatmap data={data.hourlyHeatmap} />
          </div>
        </section>

        {/* Geo */}
        <section>
          <h2 className="text-eyebrow mb-5">Geografía</h2>
          <div
            className="p-7 border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <GeoChart countries={data.countries} cities={data.cities} />
          </div>
        </section>

        {/* Referrers */}
        <section>
          <h2 className="text-eyebrow mb-5">Referrers</h2>
          <div
            className="p-7 border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <ReferrerList referrers={data.referrers} />
          </div>
        </section>

        {/* Recent */}
        <section>
          <h2 className="text-eyebrow mb-5">Clics recientes</h2>
          <div
            className="border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <RecentClicks rows={data.recentClicks} />
          </div>
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
        No se pudieron cargar las estadísticas de este enlace. Inténtalo de nuevo en un momento.
      </div>
    );
  }
}
