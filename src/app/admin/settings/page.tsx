"use client";

import { useState, useEffect } from "react";
import { 
  Shield, Globe, Key, Database, Download, AlertCircle, 
  Trash2, UserPlus, Save, RefreshCw, Moon, Sun, Languages, 
  Settings as SettingsIcon, Users as UsersIcon 
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/LanguageContext";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  const [appName, setAppName] = useState("YOURLS Node");
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "USER" });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.app_name) setAppName(data.app_name);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAppName = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({ app_name: appName })
      });
      if (res.ok) toast(t("common.success"), "success");
      else throw new Error();
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        toast("User created", "success");
        setNewUser({ username: "", password: "", role: "USER" });
        fetchUsers();
      } else {
        const err = await res.json();
        toast(err.error || "Failed", "error");
      }
    } catch {
      toast("Error", "error");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        toast("User deleted", "success");
        fetchUsers();
      }
    } catch {
      toast("Error", "error");
    }
  };

  const handleTriggerHealthCheck = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/links/health", { method: "POST" });
      if (res.ok) {
        toast("Health check initiated", "success");
        fetchUsers(); // Refresh data
      }
    } catch {
      toast("Error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 md:px-10 space-y-10 animate-fade-in relative z-10 transition-colors duration-300">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 transition-colors">{t("settings.title")}</h1>
          <p className="text-sm opacity-60">
            {t("settings.subtitle")}
          </p>
        </div>
        <button 
          onClick={handleTriggerHealthCheck}
          disabled={isLoading}
          className="btn-ghost gap-2 text-xs"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Re-Check Links
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* General Settings */}
        <section className="glass p-8 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <SettingsIcon size={20} className="text-primary" />
            {t("settings.general")}
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-60">{t("settings.app_name")}</label>
              <div className="flex gap-2">
                <input 
                  value={appName} 
                  onChange={(e) => setAppName(e.target.value)}
                  className="input-glass"
                  placeholder="YOURLS Node"
                />
                <button 
                  onClick={handleUpdateAppName}
                  disabled={isLoading}
                  className="btn-cyber px-4 shrink-0"
                >
                  <Save size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-60">{t("settings.language")}</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLanguage("en")}
                  className={`btn-ghost flex-1 ${language === "en" ? "bg-white/10 border-primary/50 text-white" : ""}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage("es")}
                  className={`btn-ghost flex-1 ${language === "es" ? "bg-white/10 border-primary/50 text-white" : ""}`}
                >
                  Español
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-60">{t("settings.mode")}</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme("dark")}
                  className={`btn-ghost flex-1 gap-2 ${theme === "dark" ? "bg-white/10 border-primary/50 text-white" : ""}`}
                >
                  <Moon size={16} /> {t("settings.dark")}
                </button>
                <button 
                  onClick={() => setTheme("light")}
                  className={`btn-ghost flex-1 gap-2 ${theme === "light" ? "bg-white/10 border-primary/50 text-white" : ""}`}
                >
                  <Sun size={16} /> {t("settings.light")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* User Management */}
        <section className="glass p-8 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UsersIcon size={20} className="text-accent" />
            {t("settings.users")}
          </h2>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold opacity-60 uppercase">{t("settings.create_user")}</p>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  placeholder="Username" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="input-glass text-xs" 
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input-glass text-xs" 
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="input-glass text-xs py-2 w-full"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button 
                  onClick={handleCreateUser}
                  className="btn-cyber px-6 py-2 rounded-xl text-xs"
                >
                  <UserPlus size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <p className="text-sm font-bold">{u.username}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">{u.role} • {u._count.urls} links</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 text-danger opacity-40 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Info */}
        <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex gap-4 col-span-full">
          <AlertCircle size={24} className="text-accent shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Multitenant Engine Active</p>
            <p className="text-xs leading-relaxed opacity-60">
              Users can only see and manage their own links. Administrators have full access to global statistics and all shortened transmissions across the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
