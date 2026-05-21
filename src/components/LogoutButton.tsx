"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
      style={{
        background: "var(--glass-bg-light)",
        border: "1px solid var(--border-glass)",
        color: "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.3)";
        e.currentTarget.style.color = "var(--color-danger)";
        e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-glass)";
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.background = "var(--glass-bg-light)";
      }}
    >
      <LogOut size={15} />
    </button>
  );
}
