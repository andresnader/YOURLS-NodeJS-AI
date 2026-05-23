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
      aria-label="Logout"
      className="w-9 h-9 flex items-center justify-center transition-colors cursor-pointer"
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
        borderRadius: "var(--radius-md)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-danger)";
        e.currentTarget.style.borderColor = "rgba(185, 28, 28, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <LogOut size={14} strokeWidth={1.75} />
    </button>
  );
}
