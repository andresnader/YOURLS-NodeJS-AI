import Link from "next/link";
import { Sparkles, Activity, ShieldCheck, Github } from "lucide-react";
import BackgroundSlider from "@/components/BackgroundSlider";
import PublicShortenForm from "@/components/PublicShortenForm";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Fetch stats for the hero section
  const totalLinks = await prisma.url.count();
  const totalClicksResult = await prisma.url.aggregate({ _sum: { clicks: true } });
  const totalClicks = totalClicksResult._sum.clicks || 0;

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
      <BackgroundSlider />

      {/* Header / Nav */}
      <nav className="fixed top-0 left-0 w-full px-8 py-6 flex justify-between items-start z-20">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glass shadow-[0_0_20px_-5px_rgba(0,240,255,0.4)] border-[#00F0FF]/30 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="text-[#00F0FF]" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter leading-none">
              YOURLS<span className="text-[#00F0FF]">Node</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">
              Next-Gen Proxy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/admin" 
            className="px-5 py-2 rounded-full glass-subtle text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-all"
          >
            Dashboard
          </Link>
          <Link 
            href="/login" 
            className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center space-y-12">
        <div className="space-y-4 max-w-2xl animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            Make your links <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#00F0FF] to-cyan-400">
              Impossibly Short.
            </span>
          </h1>
          <p className="text-lg text-white/40 font-medium">
            Standardizing the digital transmission protocol. <br className="hidden md:block" />
            Fast, secure, and infinitely scalable shortening service.
          </p>
        </div>

        <PublicShortenForm />

        {/* Floating Stats */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-12 animate-slide-up pt-8">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-white">{totalLinks.toLocaleString()}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-bold opacity-60">
              Transmissions Created
            </span>
          </div>
          <div className="w-px h-8 bg-white/10 self-center hidden md:block" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-white">{totalClicks.toLocaleString()}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-bold opacity-60">
              Arrivals Proxyied
            </span>
          </div>
          <div className="w-px h-8 bg-white/10 self-center hidden md:block" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-white">99.9%</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-bold opacity-60">
              Network Uptime
            </span>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <footer className="fixed bottom-8 left-0 w-full px-12 flex flex-col md:flex-row justify-between items-center gap-4 z-20 pointer-events-none">
        <div className="flex items-center gap-6 opacity-30">
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Live System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">SECURE TRANSMISSION</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto opacity-30 hover:opacity-100 transition-opacity">
          <a href="#" className="p-2 hover:text-[#00F0FF]"><Github size={18} /></a>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">YOURLS_NODE_V1.0</span>
        </div>
      </footer>
    </main>
  );
}
