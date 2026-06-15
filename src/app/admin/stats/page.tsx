"use client";

import StatsBar from "@/components/StatsBar";
import StatsExplorer from "@/components/StatsExplorer";
import { useTranslation } from "@/lib/LanguageContext";

export default function GlobalStatsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-14 animate-fade-in">
      <header className="space-y-3">
        <p className="text-eyebrow">{t("common.stats")}</p>
        <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>
          Estadísticas globales
        </h1>
        <p
          className="max-w-prose text-[15px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Vista en tiempo real de todos los enlaces cortos de este espacio de
          trabajo. Filtra por periodo, busca y abre cualquier enlace para ver su
          detalle.
        </p>
      </header>

      <hr className="rule" />

      <section>
        <h2 className="text-eyebrow mb-5">Resumen</h2>
        <StatsBar />
      </section>

      <section>
        <h2 className="text-eyebrow mb-5">Enlaces</h2>
        <StatsExplorer />
      </section>
    </div>
  );
}
