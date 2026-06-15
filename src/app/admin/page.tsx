"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ShortenForm from "@/components/ShortenForm";
import StatsBar from "@/components/StatsBar";
import AdminLinkManager from "@/components/AdminLinkManager";
import Bookmarklet from "@/components/Bookmarklet";
import { useTranslation } from "@/lib/LanguageContext";

export default function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10 md:py-14 space-y-14 animate-fade-in">
      {/* Editorial masthead */}
      <header className="space-y-3">
        <p className="text-eyebrow">{t("admin.title")}</p>
        <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>
          {t("admin.new_link")}
        </h1>
        <p
          className="max-w-prose text-[15px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("admin.all_links")}
        </p>
      </header>

      <hr className="rule" />

      {/* Stats */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-eyebrow">{t("common.stats")}</h2>
        </div>
        <StatsBar />
      </section>

      {/* Shorten form */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-eyebrow">{t("admin.new_link")}</h2>
        </div>
        <ShortenForm />
      </section>

      {/* Links table */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-eyebrow">{t("admin.all_links")}</h2>
        </div>
        <Suspense
          fallback={
            <div
              className="rounded-lg p-12 text-center border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <Loader2
                className="animate-spin h-6 w-6 mx-auto"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
          }
        >
          <AdminLinkManager />
        </Suspense>
      </section>

      {/* Tools */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-eyebrow">Herramientas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Bookmarklet />
        </div>
      </section>
    </div>
  );
}
