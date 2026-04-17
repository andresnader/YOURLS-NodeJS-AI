"use client";

import { BarChart3, TrendingUp, Users, MousePointer2, Globe } from "lucide-react";
import StatsBar from "@/components/StatsBar";

export default function GlobalStatsPage() {
  return (
    <div className="px-6 py-8 md:px-10 space-y-10 animate-fade-in relative z-10">
      <header>
        <h1 className="text-2xl font-bold mb-2">Network Intelligence</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Real-time global analytics across all refractive transmissions.
        </p>
      </header>

      {/* Global Overview */}
      <StatsBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center min-h-[300px]">
          <TrendingUp size={48} className="text-[#00F0FF] mb-4 opacity-50" />
          <h3 className="text-lg font-bold">Traffic Distribution</h3>
          <p className="text-sm mt-2 max-w-xs" style={{ color: "var(--text-muted)" }}>
            Select an individual link from the Dashboard to see detailed velocity and device breakdown. 
          </p>
        </div>

        <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center min-h-[300px]">
          <Globe size={48} className="text-[#A855F7] mb-4 opacity-50" />
          <h3 className="text-lg font-bold">Geographical Reach</h3>
          <p className="text-sm mt-2 max-w-xs" style={{ color: "var(--text-muted)" }}>
            We are currently tracking hits from multiple regions. Detailed map support coming in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
