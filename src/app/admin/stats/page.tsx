"use client";

import { TrendingUp, Globe } from "lucide-react";
import StatsBar from "@/components/StatsBar";
import { useTranslation } from "@/lib/LanguageContext";

export default function GlobalStatsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-14 animate-fade-in">
      <header className="space-y-3">
        <p className="text-eyebrow">{t("common.stats")}</p>
        <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>
          Global analytics
        </h1>
        <p
          className="max-w-prose text-[15px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Real-time overview across every short link in this workspace.
        </p>
      </header>

      <hr className="rule" />

      <section>
        <h2 className="text-eyebrow mb-5">Overview</h2>
        <StatsBar />
      </section>

      <section>
        <h2 className="text-eyebrow mb-5">Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              icon: TrendingUp,
              title: "Traffic distribution",
              body: "Open an individual link from the dashboard to see hourly velocity, devices, and referrers.",
            },
            {
              icon: Globe,
              title: "Geographical reach",
              body: "We are currently tracking hits from multiple regions. Detailed map support is coming in a future update.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="p-8 border min-h-[260px] flex flex-col gap-4"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <card.icon
                size={20}
                strokeWidth={1.5}
                style={{ color: "var(--color-primary)" }}
              />
              <h3
                className="font-serif text-[22px] leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {card.title}
              </h3>
              <p
                className="text-[14px] leading-relaxed max-w-md"
                style={{ color: "var(--text-secondary)" }}
              >
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
