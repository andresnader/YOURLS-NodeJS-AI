"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  UserPlus,
  Save,
  RefreshCw,
  Moon,
  Sun,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/LanguageContext";
import { useTheme } from "next-themes";

type UserRow = { id: string; username: string; role: string; _count: { urls: number } };

export default function SettingsPage() {
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [appName, setAppName] = useState("YOURLS Node");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "USER" });
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
        body: JSON.stringify({ app_name: appName }),
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
        body: JSON.stringify(newUser),
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
        body: JSON.stringify({ id }),
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
        fetchUsers();
      }
    } catch {
      toast("Error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleGroup = <V extends string>({
    value,
    options,
    onChange,
  }: {
    value: V;
    options: { value: V; label: React.ReactNode }[];
    onChange: (v: V) => void;
  }) => (
    <div
      className="flex p-0.5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5"
            style={{
              background: selected ? "var(--bg-surface)" : "transparent",
              color: selected ? "var(--text-primary)" : "var(--text-muted)",
              borderRadius: "calc(var(--radius-md) - 2px)",
              boxShadow: selected ? "var(--shadow-sm)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-12 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-3">
          <p className="text-eyebrow">{t("common.settings")}</p>
          <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>
            {t("settings.title")}
          </h1>
          <p
            className="max-w-prose text-[15px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("settings.subtitle")}
          </p>
        </div>
        <button
          onClick={handleTriggerHealthCheck}
          disabled={isLoading}
          className="btn-ghost text-[13px]"
        >
          <RefreshCw
            size={14}
            strokeWidth={1.75}
            className={isLoading ? "animate-spin" : ""}
          />
          {t("settings.health_check")}
        </button>
      </header>

      <hr className="rule" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General */}
        <section
          className="p-8 space-y-6 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <header>
            <p className="text-eyebrow">General</p>
            <h2
              className="font-serif text-[22px] mt-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("settings.general")}
            </h2>
          </header>

          <div className="space-y-5">
            <div className="space-y-2">
              <label
                className="text-[12px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("settings.app_name")}
              </label>
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
                  className="btn-primary px-4 shrink-0"
                  aria-label={t("common.save")}
                >
                  <Save size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("settings.language")}
              </label>
              <ToggleGroup
                value={language as "en" | "es"}
                onChange={(v) => setLanguage(v)}
                options={[
                  { value: "en", label: "English" },
                  { value: "es", label: "Español" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] font-medium block"
                style={{ color: "var(--text-muted)" }}
              >
                {t("settings.mode")}
              </label>
              <ToggleGroup
                value={(theme || "dark") as "dark" | "light"}
                onChange={(v) => setTheme(v)}
                options={[
                  {
                    value: "light",
                    label: (
                      <>
                        <Sun size={14} strokeWidth={1.75} />
                        {t("settings.light")}
                      </>
                    ),
                  },
                  {
                    value: "dark",
                    label: (
                      <>
                        <Moon size={14} strokeWidth={1.75} />
                        {t("settings.dark")}
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Users */}
        <section
          className="p-8 space-y-6 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <header>
            <p className="text-eyebrow">Users</p>
            <h2
              className="font-serif text-[22px] mt-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("settings.users")}
            </h2>
          </header>

          <div
            className="p-5 space-y-3"
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <p className="text-eyebrow">{t("settings.create_user")}</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="input-glass text-[13px]"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="input-glass text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              <select
                className="input-glass text-[13px] py-2 w-full cursor-pointer"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                onClick={handleCreateUser}
                className="btn-primary px-4 shrink-0"
                aria-label={t("settings.create_user")}
              >
                <UserPlus size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-3 py-2.5 transition-colors"
                style={{
                  borderBottom: "1px solid var(--border-soft)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[14px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {u.username}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span className="font-mono">{u.role}</span> · {u._count.urls} links
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1.5 cursor-pointer transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-danger)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                  aria-label="Delete user"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div
          className="col-span-full p-5 flex gap-4 border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-soft)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <AlertCircle
            size={18}
            strokeWidth={1.75}
            style={{ color: "var(--color-primary)", marginTop: 2 }}
            className="shrink-0"
          />
          <div className="space-y-1">
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Multitenant access
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Users can only see and manage their own links. Administrators have
              full access to global statistics and every short link across the
              workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
