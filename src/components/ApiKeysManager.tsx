"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Key,
} from "lucide-react";
import { useTranslation } from "@/lib/LanguageContext";

type ApiKey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
};

/**
 * Self-contained API key manager. Rendered as a section inside the Settings
 * page (previously its own /admin/keys route).
 */
export default function ApiKeysManager() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/keys", { credentials: "include" });
      const data = await res.json();
      if (data.success) setKeys(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.data, ...keys]);
        setLastCreatedKey(data.data.key);
        setNewKeyName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Revoke this key?")) return;
    try {
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-eyebrow">{t("common.api_keys")}</p>
        <h2
          className="font-serif text-[22px] mt-1"
          style={{ color: "var(--text-primary)" }}
        >
          API credentials
        </h2>
        <p
          className="max-w-prose text-[14px] leading-relaxed mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Generate API keys for integrations such as the WordPress plugin,
          third-party automations, or your own scripts. Treat each key like a
          password — anyone with one can shorten links on your behalf.
        </p>
      </header>

      {/* Create */}
      <div
        className="p-8 space-y-6 border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <header>
          <p className="text-eyebrow">New credential</p>
          <h3
            className="font-serif text-[20px] mt-1"
            style={{ color: "var(--text-primary)" }}
          >
            Generate a key
          </h3>
        </header>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3"
        >
          <input
            type="text"
            placeholder="e.g. WordPress Ameizin"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="input-glass"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="btn-primary px-6 whitespace-nowrap"
          >
            {creating ? (
              <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <Plus size={16} strokeWidth={1.75} />
            )}
            Generate
          </button>
        </form>

        {lastCreatedKey && (
          <div
            className="p-5 space-y-3 animate-slide-up border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-glow)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p
              className="text-[13px] font-medium inline-flex items-center gap-1.5"
              style={{ color: "var(--color-primary)" }}
            >
              <CheckCircle2 size={14} strokeWidth={1.75} />
              Key created
            </p>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
              <code
                className="flex-1 font-mono text-[12px] p-3 break-all border"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                }}
              >
                {lastCreatedKey}
              </code>
              <button
                onClick={() => copyToClipboard(lastCreatedKey)}
                className="btn-ghost px-4 py-3 whitespace-nowrap"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle2 size={14} strokeWidth={1.75} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} strokeWidth={1.75} /> Copy
                  </>
                )}
              </button>
            </div>
            <p
              className="text-[12px] inline-flex items-start gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <AlertCircle
                size={13}
                strokeWidth={1.75}
                className="shrink-0 mt-0.5"
              />
              <span>
                This is the only time the full key is shown. Store it somewhere
                safe.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-eyebrow">Active credentials</h3>

        {loading ? (
          <div
            className="p-16 text-center border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Loader2
              size={20}
              strokeWidth={1.75}
              className="animate-spin mx-auto mb-3"
              style={{ color: "var(--color-primary)" }}
            />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Loading credentials…
            </p>
          </div>
        ) : keys.length === 0 ? (
          <div
            className="p-16 text-center border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Key
              size={32}
              strokeWidth={1.5}
              className="mx-auto mb-4"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="font-serif text-[20px]"
              style={{ color: "var(--text-primary)" }}
            >
              No credentials yet
            </p>
            <p className="text-[13px] mt-2" style={{ color: "var(--text-muted)" }}>
              Generate your first key above to start integrating.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <table className="w-full text-[14px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Name", "Created", "Last used", ""].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    style={{ borderBottom: "1px solid var(--border-soft)" }}
                  >
                    <td className="px-5 py-4">
                      <p
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {k.name}
                      </p>
                    </td>
                    <td
                      className="px-5 py-4 text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      className="px-5 py-4 text-[13px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {k.lastUsed
                        ? new Date(k.lastUsed).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="btn-ghost text-[12px] py-1.5 px-3"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--color-danger)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-secondary)")
                        }
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
