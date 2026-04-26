"use client";

import { Sparkles, LayoutDashboard, Settings, BarChart3, LogOut, ChevronLeft, ChevronRight, Menu, Key, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { useTranslation } from "@/lib/LanguageContext";

function getSession() {
  // Try localStorage first (primary session store)
  const localStorageSession = localStorage.getItem('yourls_session');
  if (localStorageSession) {
    try {
      return JSON.parse(localStorageSession);
    } catch {
      localStorage.removeItem('yourls_session');
    }
  }
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appName, setAppName] = useState("YOURLS Node");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Check session from localStorage (primary) or cookie
    const session = getSession();
    if (!session) {
      console.log('No session found in localStorage, redirecting to login');
      router.replace('/login');
      return;
    }
    console.log('Session valid:', session);
    setIsAuthChecked(true);

    // Also fetch settings (this also validates server-side session)
    fetch("/api/settings", { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.app_name) setAppName(data.app_name);
      })
      .catch(console.error);
  }, [router]);

  const menuItems = [
    { name: t("common.dashboard"), icon: LayoutDashboard, href: "/admin", color: "#00F0FF" },
    { name: t("common.stats"), icon: BarChart3, href: "/admin/stats", color: "#A855F7" },
    { name: t("common.api_keys"), icon: Key, href: "/admin/keys", color: "#EC4899" },
    { name: t("common.settings"), icon: Settings, href: "/admin/settings", color: "#FBBF24" },
  ];

  const logoParts = appName.split(" ");
  const lastPart = logoParts.pop();
  const firstPart = logoParts.join(" ");

  // Don't render until auth is checked
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-void text-primary selection:bg-primary/30 transition-colors duration-300">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20" style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }} />
      </div>

      {/* Sidebar Desktop */}
      <aside 
        className={`hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-72'}`}
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(32px) saturate(1.8)",
          borderRight: "1px solid var(--border-glass)",
        }}
      >
        <div className="p-6 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center p-0.5" style={{ background: "linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.1))", border: "1px solid var(--border-glow)" }}>
                <Sparkles size={18} className="text-primary" />
              </div>
              <span className="font-extrabold tracking-widest text-lg">
                {firstPart} <span className="text-primary">{lastPart}</span>
              </span>
            </div>
          )}
          {collapsed && <Sparkles size={24} className="text-primary mx-auto" />}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center shadow-glow-sm hover:scale-110 transition-transform"
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
                  className={`transition-colors ${active ? '' : 'text-muted group-hover:text-primary'}`}
                  style={{ color: active ? item.color : "" }}
                />
                {!collapsed && (
                  <span className={`text-sm font-medium tracking-wide transition-all ${active ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>
                    {item.name}
                  </span>
                )}
                {active && (
                  <div className="absolute right-0 w-1 h-6 rounded-l-full shadow-glow" style={{ background: item.color }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-glass pb-8">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Nav Toggle */}
      <div className={`md:hidden fixed inset-0 bg-void/80 backdrop-blur-md z-50 transition-all ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col h-full p-8 space-y-8">
              <button 
                className="self-end p-2"
                onClick={() => setMobileOpen(false)}
              >
                  <ChevronLeft size={24} />
              </button>
              {menuItems.map(item => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-6 text-xl font-bold"
                  >
                      <item.icon size={28} style={{ color: item.color }} />
                      {item.name}
                  </Link>
              ))}
              <div className="pt-8 mt-auto border-t border-glass">
                  <LogoutButton />
              </div>
          </div>
      </div>

      <button 
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-black shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Content Area */}
      <div className="flex-1 w-full relative z-10 flex flex-col">
        {/* Top bar for mobile/context */}
        <header className="md:hidden px-6 py-4 flex items-center justify-between bg-void/80 backdrop-blur-md sticky top-0 z-30 border-b border-glass">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <span className="font-bold tracking-widest uppercase text-xs">{appName}</span>
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

