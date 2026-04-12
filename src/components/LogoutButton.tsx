"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      title="Cerrar Sessión"
      className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel transition-all hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-500 dark:hover:border-red-500"
    >
      <LogOut size={18} />
    </button>
  );
}
