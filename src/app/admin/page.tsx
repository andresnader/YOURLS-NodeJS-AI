import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import ShortenForm from "@/components/ShortenForm";
import StatsBar from "@/components/StatsBar";
import AdminLinkManager from "@/components/AdminLinkManager";
import Bookmarklet from "@/components/Bookmarklet";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="px-6 py-8 md:px-10 space-y-8 animate-fade-in relative z-10">
        {/* Stats */}
        <StatsBar />

        {/* Shorten Form */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Shorten a URL
          </h2>
          <ShortenForm />
        </section>

        {/* Links */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Your Transmissions
          </h2>
          <Suspense
            fallback={
              <div className="glass rounded-2xl p-12 text-center">
                <div
                  className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full mx-auto"
                  style={{ borderColor: "#00F0FF", borderTopColor: "transparent" }}
                />
              </div>
            }
          >
            <AdminLinkManager />
          </Suspense>
        </section>

        {/* Tools */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3"
            style={{ color: "var(--text-muted)" }}
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
