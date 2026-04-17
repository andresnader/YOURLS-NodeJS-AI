"use client";

import { Sparkles, LayoutDashboard, Settings, BarChart3, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin", color: "#00F0FF" },
    { name: "Global Stats", icon: BarChart3, href: "/admin/stats", color: "#A855F7" },
    { name: "Configuration", icon: Settings, href: "/admin/settings", color: "#FBBF24" },
  ];

  return (
    <div className="min-h-screen flex bg-[#040609] text-white selection:bg-[#00F0FF]/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20" style={{ background: "radial-gradient(circle, #00F0FF 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-10" style={{ background: "radial-gradient(circle, #A855F7 0%, transparent 70%)" }} />
      </div>

      {/* Sidebar Desktop */}
      <aside 
        className={`hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-72'}`}
        style={{
          background: "rgba(4, 6, 9, 0.4)",
          backdropFilter: "blur(32px) saturate(1.8)",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="p-6 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center p-0.5" style={{ background: "linear-gradient(135deg, #00F0FF20, #A855F710)", border: "1px solid #00F0FF30" }}>
                <Sparkles size={18} style={{ color: "#00F0FF" }} />
              </div>
              <span className="font-extrabold tracking-widest text-lg">YOURLS<span className="text-[#00F0FF]">Node</span></span>
            </div>
          )}
          {collapsed && <Sparkles size={24} style={{ color: "#00F0FF" }} className="mx-auto" />}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#00F0FF] text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} /> }
          </button>
        </div>

        <nav className="flex-1 px-3 mt-10 space-y-2">
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${active ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'}`}
              >
                <item.icon 
                  size={20} 
                  style={{ color: active ? item.color : "var(--text-muted)" }} 
                  className={`transition-colors ${!active && 'group-hover:text-white'}`}
                />
                {!collapsed && (
                  <span className={`text-sm font-medium tracking-wide transition-all ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {item.name}
                  </span>
                )}
                {active && (
                  <div className="absolute right-0 w-1 h-6 rounded-l-full" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 pb-8">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Nav Toggle */}
      <button 
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#00F0FF] text-black shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Content Area */}
      <div className="flex-1 w-full relative z-10 flex flex-col">
        {/* Top bar for mobile/context */}
        <header className="md:hidden px-6 py-4 flex items-center justify-between bg-[#040609]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Sparkles size={20} style={{ color: "#00F0FF" }} />
            <span className="font-bold tracking-widest uppercase text-xs">YOURLS Node</span>
          </div>
          <LogoutButton />
        </header>

        <main className="flex-1 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
