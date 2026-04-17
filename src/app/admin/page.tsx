"use client";

import { Suspense } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import ShortenForm from "@/components/ShortenForm";
import StatsBar from "@/components/StatsBar";
import AdminLinkManager from "@/components/AdminLinkManager";
import Bookmarklet from "@/components/Bookmarklet";
import { useTranslation } from "@/lib/LanguageContext";

export default function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="px-6 py-8 md:px-10 space-y-8 animate-fade-in relative z-10 transition-colors duration-300">
        {/* Stats */}
        <StatsBar />

        {/* Shorten Form */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 text-muted"
          >
            {t("admin.new_link")}
          </h2>
          <ShortenForm />
        </section>

        {/* Links */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4 text-muted"
          >
            {t("admin.all_links")}
          </h2>
          <Suspense
            fallback={
              <div className="glass rounded-2xl p-12 text-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
              </div>
            }
          >
            <AdminLinkManager />
          </Suspense>
        </section>

        {/* Tools */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 text-muted"
          >
            Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Bookmarklet />
          </div>
        </section>
      </div>
  );
}

