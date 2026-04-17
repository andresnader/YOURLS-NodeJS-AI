"use client";

import { 
  Shield, 
  Globe, 
  Key, 
  Database, 
  Server, 
  Download, 
  AlertCircle 
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yourls-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast("System backup (CSV) downloaded successfully", "success");
    } catch {
      toast("Export failed", "error");
    }
  };

  const systemConfigs = [
    {
      title: "Security & Rate Limiting",
      icon: Shield,
      status: "Active",
      description: "In-memory sliding window limiter at 10 requests/min per IP.",
      color: "#00F0FF"
    },
    {
      title: "Domain Blacklist",
      icon: Globe,
      status: "Configured",
      description: "Blocking known recursive and malicious domains (lib/blacklist.ts).",
      color: "#A855F7"
    },
    {
      title: "Access Control",
      icon: Key,
      status: "Protected",
      description: "Administrator access secured via ADMIN_PASSWORD environment variable.",
      color: "#FBBF24"
    },
    {
      title: "Database Engine",
      icon: Database,
      status: "Synchronized",
      description: "PostgreSQL on Railway with Prisma ORM (v6.19.3).",
      color: "#34D399"
    }
  ];

  return (
    <div className="px-6 py-8 md:px-10 space-y-10 animate-fade-in relative z-10">
      <header>
        <h1 className="text-2xl font-bold mb-2">System Configuration</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your refractive engine parameters and security protocols.
        </p>
      </header>

      {/* Quick Actions */}
      <section className="glass p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Download size={20} className="text-[#00F0FF]" />
            Data Persistence
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Download a full CSV snapshot of all shortened transmissions and analytics.
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-cyber px-8 py-3 rounded-2xl flex items-center gap-2"
        >
          Generate Export
        </button>
      </section>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemConfigs.map((config) => (
          <div key={config.title} className="glass p-6 rounded-3xl group hover:scale-[1.01] transition-transform cursor-default">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
              >
                <config.icon size={20} style={{ color: config.color }} />
              </div>
              <span 
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight"
                style={{ background: "rgba(255, 255, 255, 0.05)", color: config.color, border: `1px solid ${config.color}20` }}
              >
                {config.status}
              </span>
            </div>
            <h3 className="text-base font-bold mb-1">{config.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {config.description}
            </p>
          </div>
        ))}
      </div>

      {/* Info Notice */}
      <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex gap-4">
        <AlertCircle size={24} className="text-[#A855F7] shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Platform Architecture Note</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Advanced parameters like rate limit thresholds and blacklisted domains are currently managed via the codebase (lib folder) to ensure performance. Core credentials should be rotated via Railway Environment Variables.
          </p>
        </div>
      </div>
    </div>
  );
}
