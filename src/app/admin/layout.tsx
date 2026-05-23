"use client";

import {
  LayoutDashboard,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  Key,
  BookOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { useTranslation } from "@/lib/LanguageContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appName, setAppName] = useState("YOURLS Node");

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.app_name) setAppName(data.app_name);
      })
      .catch(() => {});
  }, []);

  const menuItems = [
    { name: t("common.dashboard"), icon: LayoutDashboard, href: "/admin" },
    { name: t("common.stats"), icon: BarChart3, href: "/admin/stats" },
    { name: t("common.api_keys"), icon: Key, href: "/admin/keys" },
    { name: t("common.documentation"), icon: BookOpen, href: "/admin/docs" },
    { name: t("common.settings"), icon: Settings, href: "/admin/settings" },
  ];

  const logoParts = appName.split(" ");
  const lastPart = logoParts.pop();
  const firstPart = logoParts.join(" ");

  return (
    <div className="min-h-screen flex">
      {/* ─── Sidebar (desktop) ─── */}
      <aside
        className={`hidden md:flex flex-col sticky top-0 h-screen transition-[width] duration-200 z-40 border-r ${
          collapsed ? "w-20" : "w-64"
        }`}
        style={{
          background: "var(--bg-deep)",
          borderColor: "var(--border)",
        }}
      >
        <div className="px-6 pt-7 pb-8 flex items-center justify-between">
          {!collapsed && (
            <Link href="/admin" className="font-serif text-[22px] leading-none">
              <span style={{ color: "var(--text-primary)" }}>{firstPart || lastPart}</span>
              {firstPart && (
                <span className="italic" style={{ color: "var(--color-primary)" }}>
                  {" "}
                  {lastPart}
                </span>
              )}
            </Link>
          )}
          {collapsed && (
            <Link
              href="/admin"
              className="font-serif text-2xl italic mx-auto"
              style={{ color: "var(--color-primary)" }}
            >
              Y
            </Link>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {menuItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group cursor-pointer"
                style={{
                  background: active ? "var(--bg-hover)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <item.icon size={17} strokeWidth={1.75} />
                {!collapsed && (
                  <span className="text-[14px] font-medium tracking-tight">
                    {item.name}
                  </span>
                )}
                {active && !collapsed && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className="px-4 py-5 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <LogoutButton />
        </div>
      </aside>

      {/* ─── Mobile Nav Drawer ─── */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(26, 35, 50, 0.5)" }}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className="flex flex-col h-full w-72 p-6 space-y-6"
          style={{ background: "var(--bg-deep)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl">
              {firstPart}
              {firstPart && (
                <span className="italic" style={{ color: "var(--color-primary)" }}>
                  {" "}
                  {lastPart}
                </span>
              )}
              {!firstPart && (
                <span style={{ color: "var(--text-primary)" }}>{lastPart}</span>
              )}
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md"
                  style={{
                    background: active ? "var(--bg-hover)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <item.icon size={18} strokeWidth={1.75} />
                  <span className="text-[15px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div
            className="pt-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* ─── Mobile menu button ─── */}
      <button
        className="md:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center z-50 cursor-pointer shadow-lg"
        style={{
          background: "var(--color-primary)",
          color: "#FFFFFF",
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ─── Content area ─── */}
      <div className="flex-1 w-full flex flex-col min-w-0">
        <header
          className="md:hidden px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b"
          style={{
            background: "var(--bg-void)",
            borderColor: "var(--border)",
          }}
        >
          <span className="font-serif text-lg">
            {firstPart}
            {firstPart && (
              <span className="italic" style={{ color: "var(--color-primary)" }}>
                {" "}
                {lastPart}
              </span>
            )}
            {!firstPart && <span>{lastPart}</span>}
          </span>
          <LogoutButton />
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
