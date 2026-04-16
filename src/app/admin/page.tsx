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
    <main className="min-h-screen relative overflow-hidden">
      {/* Ambient decorative orbs */}
      <div
        className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.06) 0%, transparent 70%)",
          animation: "floatOrb 25s ease-in-out infinite",
        }}
      />
      <div
        className="fixed bottom-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, transparent 70%)",
          animation: "floatOrb 30s ease-in-out infinite reverse",
        }}
      />
      <div
        className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.03) 0%, transparent 70%)",
          animation: "floatOrb 20s ease-in-out infinite 5s",
        }}
      />

      {/* Top Nav — sticky glass bar */}
      <nav
        className="sticky top-0 z-30 px-6 py-3"
        style={{
          background: "rgba(4, 6, 9, 0.6)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          borderBottom: "1px solid var(--border-glass)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.1))",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                boxShadow: "0 0 20px -5px rgba(0, 240, 255, 0.2)",
              }}
            >
              <Sparkles size={16} style={{ color: "#00F0FF" }} />
            </div>
            <h1 className="text-lg font-extrabold tracking-widest" style={{ color: "var(--text-primary)" }}>
              YOURLS<span style={{ color: "#00F0FF" }}>Node</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
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
    </main>
  );
}
